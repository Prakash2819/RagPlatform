from jose import jwt, JWTError
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import HTTPException, Header
import hashlib, secrets, os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY  = os.getenv("JWT_SECRET", "changeme")
ALGORITHM   = "HS256"
pwd_context = CryptContext(
    schemes=["bcrypt"], deprecated="auto"
)

# Password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# JWT 
def create_token(
    user_id: str,
    tenant_id: str,
    role: str
) -> str:
    payload = {
        "user_id":   user_id,
        "tenant_id": tenant_id,
        "role":      role,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(
        payload, SECRET_KEY, algorithm=ALGORITHM
    )

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            401, "Invalid or expired token."
        )

def get_current_user(
    authorization: str = Header(...)
) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            401, "Token must start with Bearer"
        )
    token = authorization.split(" ")[1]
    return decode_token(token)

def require_admin(
    authorization: str = Header(...)
) -> dict:
    user = get_current_user(authorization)
    if user["role"] not in ["admin", "superadmin"]:
        raise HTTPException(
            403, "Admins only."
        )
    return user

# API Key 
def generate_api_key() -> tuple:
    raw_key  = "ak_" + secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(
        raw_key.encode()
    ).hexdigest()
    return raw_key, key_hash