from fastapi import APIRouter, Depends, HTTPException
from models.database import tenants_col, users_col
from services.auth_service import get_current_user
from bson import ObjectId

router = APIRouter(
    prefix="/superadmin", tags=["SuperAdmin"]
)

def require_superadmin(
    user: dict = Depends(get_current_user)
):
    if user["role"] != "superadmin":
        raise HTTPException(403, "Superadmin only.")
    return user

@router.get("/tenants")
def get_all_tenants(
    user: dict = Depends(require_superadmin)
):
    tenants = list(tenants_col.find({}))
    for t in tenants:
        t["_id"]        = str(t["_id"])
        t["created_at"] = str(t["created_at"])
        t.pop("api_key_hash", None)
        # Count users
        t["user_count"] = users_col.count_documents({
            "tenant_id": str(t["_id"])
        })
    return {"tenants": tenants}

@router.delete("/tenant/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    user: dict = Depends(require_superadmin)
):
    tenants_col.delete_one({"_id": ObjectId(tenant_id)})
    users_col.delete_many({"tenant_id": tenant_id})
    return {"message": "Tenant deleted."}