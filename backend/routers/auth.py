from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from fastapi import Depends
from dotenv import load_dotenv
import os

load_dotenv()
from services.auth_service import get_current_user
from models.database import users_col, tenants_col
from services.auth_service import (
    hash_password,
    verify_password,
    create_token,
    generate_api_key
)
from services.vector_store import create_collection
from datetime import datetime
from bson import ObjectId
import random, string

router = APIRouter(prefix="/auth", tags=["Auth"])

# Helpers 
def generate_company_code(name: str) -> str:
    prefix = name[:4].upper().replace(" ", "")
    suffix = "".join(
        random.choices(string.digits, k=4)
    )
    return f"{prefix}{suffix}"

def extract_domain(email: str) -> str:
    return email.split("@")[1].lower()

# Request models 
class OrgRegisterRequest(BaseModel):
    company_name:  str
    email:         EmailStr
    password:      str
    system_prompt: str = (
        "You are a helpful assistant. "
        "Answer only from uploaded documents."
    )
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str

# Check domain
@router.get("/check-domain")
def check_domain(domain: str):
    tenant = tenants_col.find_one({"domain": domain})
    if tenant:
        return {
            "exists":       True,
            "company_name": tenant["name"]
        }
    return {"exists": False}

# Organization Register 
@router.post("/register/org")
def register_org(req: OrgRegisterRequest):

    # Check email not used
    if users_col.find_one({"email": req.email}):
        raise HTTPException(
            400, "Email already registered."
        )

    domain = extract_domain(req.email)

    # Check domain not already registered
    if tenants_col.find_one({"domain": domain}):
        raise HTTPException(
            400,
            f"An organization with domain "
            f"'{domain}' is already registered."
        )

    # Create Qdrant collection
    collection_name = create_collection()

    # Generate API key
    raw_key, key_hash = generate_api_key()
    company_code      = generate_company_code(
        req.company_name
    )

    # Create tenant
    tenant = {
        "name":         req.company_name,
        "domain":       domain,
        "company_code": company_code,
        "plan":         "free",
        "chatbot": {
            "name":              f"{req.company_name} Assistant",
            "system_prompt":     req.system_prompt,
            "qdrant_collection": collection_name
        },
        "api_key_hash":   key_hash,
        "api_key_active": True,
        "created_at":     datetime.utcnow()
    }
    t_result  = tenants_col.insert_one(tenant)
    tenant_id = str(t_result.inserted_id)

    # Create admin user
    user = {
        "email":         req.email,
        "password_hash": hash_password(req.password),
        "role":          "admin",
        "tenant_id":     tenant_id,
        "created_at":    datetime.utcnow()
    }
    u_result = users_col.insert_one(user)
    user_id  = str(u_result.inserted_id)

    token = create_token(user_id, tenant_id, "admin")

    return {
        "message":      f"Welcome! {req.company_name} registered.",
        "token":        token,
        "role":         "admin",
        "tenant_id":    tenant_id,
        "company_code": company_code,
        "api_key":      raw_key,
        "warning":      "Save API key — shown only once!"
    }

#  Employee 

class EmployeeRegisterRequest(BaseModel):
    name:     str
    email:    EmailStr
    password: str

class EmployeeLoginRequest(BaseModel):
    email:    EmailStr
    password: str

# Employee Register 
@router.post("/register/employee")
def register_employee(req: EmployeeRegisterRequest):

    # Check email not already used
    if users_col.find_one({"email": req.email}):
        raise HTTPException(
            400,
            "An account with this email already exists. "
            "Please login instead."
        )

    # Extract domain and find organization
    domain = extract_domain(req.email)
    tenant = tenants_col.find_one({"domain": domain})

    if not tenant:
        raise HTTPException(
            404,
            f"Your organization is not registered on "
            f"this platform. The domain '{domain}' is "
            f"not associated with any organization. "
            f"Please ask your admin to register first."
        )

    if len(req.password) < 8:
        raise HTTPException(
            400,
            "Password must be at least 8 characters."
        )

    tenant_id = str(tenant["_id"])

    # Create employee account
    user = {
        "name":          req.name,
        "email":         req.email,
        "password_hash": hash_password(req.password),
        "role":          "member",
        "tenant_id":     tenant_id,
        "created_at":    datetime.utcnow()
    }
    result  = users_col.insert_one(user)
    user_id = str(result.inserted_id)

    token = create_token(user_id, tenant_id, "member")

    return {
        "message":      f"Welcome to {tenant['name']}!",
        "token":        token,
        "role":         "member",
        "tenant_id":    tenant_id,
        "user_id":      user_id,
        "company_name": tenant["name"]
    }

# Employee Login 
@router.post("/login/employee")
def employee_login(req: EmployeeLoginRequest):

    # Find user by email
    user = users_col.find_one({"email": req.email})

    if not user:
        # Check if their domain exists at least
        domain = extract_domain(req.email)
        tenant = tenants_col.find_one({"domain": domain})

        if not tenant:
            raise HTTPException(
                404,
                f"Your organization with domain '{domain}' "
                f"is not registered on this platform. "
                f"Ask your admin to register first."
            )

        raise HTTPException(
            404,
            "No account found with this email. "
            "Please register first."
        )

    # Check role
    if user["role"] not in ["member", "admin"]:
        raise HTTPException(403, "Access denied.")

    # Check password
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(401, "Wrong password.")

    # Get company name
    tenant = tenants_col.find_one({
        "_id": ObjectId(user["tenant_id"])
    })

    token = create_token(
        str(user["_id"]),
        user["tenant_id"],
        user["role"]
    )

    return {
        "message":      "Login successful!",
        "token":        token,
        "role":         user["role"],
        "tenant_id":    user["tenant_id"],
        "user_id":      str(user["_id"]),
        "company_name": tenant["name"] if tenant else ""
    }

# Login

@router.post("/login")
def login(req: LoginRequest):
    user = users_col.find_one({"email": req.email})

    if not user or not verify_password(
        req.password, user["password_hash"]
    ):
        raise HTTPException(
            401, "Wrong email or password."
        )

    token = create_token(
        str(user["_id"]),
        str(user["tenant_id"]) if user.get("tenant_id") else "",
        user["role"]
    )

    # Get company name if not superadmin

    company_name = ""
    if user.get("tenant_id"):
        tenant = tenants_col.find_one({
            "_id": ObjectId(user["tenant_id"])
        })
        if tenant:
            company_name = tenant["name"]

    return {
        "message":      "Login successful!",
        "token":        token,
        "role":         user["role"],
        "tenant_id":    str(user["tenant_id"]) if user.get("tenant_id") else "",
        "user_id":      str(user["_id"]),
        "email":        user["email"],
        "company_name": company_name
    }

# change password

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password:     str

@router.post("/change-password")
def change_password(
    req:  ChangePasswordRequest,
    user: dict = Depends(get_current_user)
):
    db_user = users_col.find_one({
        "_id": ObjectId(user["user_id"])
    })
    if not db_user:
        raise HTTPException(404, "User not found")

    if not verify_password(
        req.current_password,
        db_user["password_hash"]
    ):
        raise HTTPException(401, "Current password is wrong")

    if len(req.new_password) < 8:
        raise HTTPException(
            400, "Password must be at least 8 characters"
        )

    users_col.update_one(
        {"_id": ObjectId(user["user_id"])},
        {"$set": {
            "password_hash": hash_password(req.new_password)
        }}
    )
    return {"message": "Password changed successfully!"}

# create super admin

@router.post("/seed/superadmin")
def seed_superadmin():
    # Get from env
    email = os.getenv("SUPERADMIN_EMAIL")
    password = os.getenv("SUPERADMIN_PASSWORD")

    if not email or not password:
        raise HTTPException(500, "Superadmin credentials not set in .env")

    # Check if already exists
    existing = users_col.find_one({"role": "superadmin"})
    if existing:
        raise HTTPException(400, "Superadmin already exists.")

    user = {
        "email": email,
        "password_hash": hash_password(password),
        "role": "superadmin",
        "tenant_id": None,
        "created_at": datetime.utcnow()
    }

    users_col.insert_one(user)

    return {
        "message": "Superadmin created!",
        "email": email,
        "warning": "Change password after first login!"
    }