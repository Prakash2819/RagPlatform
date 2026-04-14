# routers/tenant.py

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from models.database import tenants_col, analytics_col
from services.auth_service import (
    get_current_user,
    require_admin,
    generate_api_key
)
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/tenant", tags=["Tenant"])

class UpdateChatbotRequest(BaseModel):
    name:          str = None
    system_prompt: str = None

# Get tenant info
@router.get("/info")
def get_tenant_info(
    user: dict = Depends(get_current_user)
):
    tenant = tenants_col.find_one({
        "_id": ObjectId(user["tenant_id"])
    })
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    tenant["_id"]        = str(tenant["_id"])
    tenant["created_at"] = str(tenant["created_at"])
    tenant.pop("api_key_hash", None)

    return tenant

# Update chatbot
@router.put("/chatbot/update")
def update_chatbot(
    req:  UpdateChatbotRequest,
    user: dict = Depends(require_admin)
):
    fields = {}
    if req.name:
        fields["chatbot.name"] = req.name
    if req.system_prompt:
        fields["chatbot.system_prompt"] = req.system_prompt

    tenants_col.update_one(
        {"_id": ObjectId(user["tenant_id"])},
        {"$set": fields}
    )
    return {"message": "Chatbot updated!"}

#  Generate API key
@router.post("/apikey/generate")
def generate_new_key(
    user: dict = Depends(require_admin)
):
    raw_key, key_hash = generate_api_key()

    tenants_col.update_one(
        {"_id": ObjectId(user["tenant_id"])},
        {"$set": {
            "api_key_hash":   key_hash,
            "api_key_active": True
        }}
    )

    return {
        "message": "New API key generated!",
        "api_key": raw_key,
        "warning": "Save this key — shown only once!"
    }

#  Revoke API key
@router.post("/apikey/revoke")
def revoke_key(
    user: dict = Depends(require_admin)
):
    tenants_col.update_one(
        {"_id": ObjectId(user["tenant_id"])},
        {"$set": {"api_key_active": False}}
    )
    return {"message": "API key revoked."}

#  Analytics 
@router.get("/analytics")
def get_analytics(
    user: dict = Depends(require_admin)
):
    total  = analytics_col.count_documents(
        {"tenant_id": user["tenant_id"]}
    )
    recent = list(
        analytics_col.find(
            {"tenant_id": user["tenant_id"]}
        ).sort("asked_at", -1).limit(50)
    )

    for item in recent:
        item["_id"]      = str(item["_id"])
        item["asked_at"] = str(item["asked_at"])

        # Get member name 
        if item.get("asked_by") in ["member", "admin"]:
            pass

    return {
        "total_queries": total,
        "recent":        recent
    }