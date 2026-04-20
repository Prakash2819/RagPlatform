# routers/superadmin.py

from fastapi import APIRouter, Depends, HTTPException
from models.database import (
    tenants_col, users_col,
    documents_col, analytics_col
)
from services.auth_service import get_current_user
from services.vector_store import delete_collection
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

# Get all tenants
@router.get("/tenants")
def get_all_tenants(
    user: dict = Depends(require_superadmin)
):
    tenants = list(tenants_col.find({}))
    for t in tenants:
        t["_id"]        = str(t["_id"])
        t["created_at"] = str(t["created_at"])
        t.pop("api_key_hash", None)
        t["user_count"] = users_col.count_documents({
            "tenant_id": str(t["_id"])
        })
        t["doc_count"] = documents_col.count_documents({
            "tenant_id": str(t["_id"])
        })
        t["query_count"] = analytics_col.count_documents({
            "tenant_id": str(t["_id"])
        })
    return {"tenants": tenants}

# Get single tenant 
@router.get("/tenant/{tenant_id}")
def get_tenant_detail(
    tenant_id: str,
    user: dict = Depends(require_superadmin)
):
    tenant = tenants_col.find_one({
        "_id": ObjectId(tenant_id)
    })
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    tenant["_id"]        = str(tenant["_id"])
    tenant["created_at"] = str(tenant["created_at"])
    tenant.pop("api_key_hash", None)

    return {"tenant": tenant}

# Get tenant employees
@router.get("/tenant/{tenant_id}/employees")
def get_tenant_employees(
    tenant_id: str,
    user: dict = Depends(require_superadmin)
):
    employees = list(users_col.find({
        "tenant_id": tenant_id
    }))
    for e in employees:
        e["_id"]        = str(e["_id"])
        e["created_at"] = str(e["created_at"])
        e.pop("password_hash", None)
        # Count their queries
        e["query_count"] = analytics_col.count_documents({
            "user_id": str(e["_id"])
        })
    return {"employees": employees}

# Get tenant documents
@router.get("/tenant/{tenant_id}/documents")
def get_tenant_documents(
    tenant_id: str,
    user: dict = Depends(require_superadmin)
):
    docs = list(documents_col.find({
        "tenant_id": tenant_id
    }))
    for doc in docs:
        doc["_id"]         = str(doc["_id"])
        doc["uploaded_at"] = str(doc["uploaded_at"])
    return {"documents": docs}

# Get tenant queries
@router.get("/tenant/{tenant_id}/queries")
def get_tenant_queries(
    tenant_id: str,
    user: dict = Depends(require_superadmin)
):
    queries = list(analytics_col.find(
        {"tenant_id": tenant_id}
    ).sort("asked_at", -1).limit(100))

    for q in queries:
        q["_id"]      = str(q["_id"])
        q["asked_at"] = str(q["asked_at"])

    return {
        "queries": queries,
        "total":   analytics_col.count_documents({
            "tenant_id": tenant_id
        })
    }

# Get employee queries
@router.get("/tenant/{tenant_id}/employee/{user_id}/queries")
def get_employee_queries(
    tenant_id: str,
    user_id:   str,
    user: dict = Depends(require_superadmin)
):
    queries = list(analytics_col.find({
        "tenant_id": tenant_id,
        "user_id":   user_id,
    }).sort("asked_at", -1).limit(50))

    for q in queries:
        q["_id"]      = str(q["_id"])
        q["asked_at"] = str(q["asked_at"])

    return {"queries": queries}

# Delete tenant document
@router.delete("/tenant/{tenant_id}/document/{doc_id}")
def delete_tenant_document(
    tenant_id: str,
    doc_id:    str,
    user: dict = Depends(require_superadmin)
):
    doc = documents_col.find_one({
        "_id":       ObjectId(doc_id),
        "tenant_id": tenant_id
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    documents_col.delete_one({"_id": ObjectId(doc_id)})
    return {"message": "Document deleted"}

# Delete single query
@router.delete("/tenant/{tenant_id}/query/{query_id}")
def delete_tenant_query(
    tenant_id: str,
    query_id:  str,
    user: dict = Depends(require_superadmin)
):
    analytics_col.delete_one({
        "_id":       ObjectId(query_id),
        "tenant_id": tenant_id
    })
    return {"message": "Query deleted"}

# Delete all queries
@router.delete("/tenant/{tenant_id}/queries/all")
def delete_all_queries(
    tenant_id: str,
    user: dict = Depends(require_superadmin)
):
    result = analytics_col.delete_many({
        "tenant_id": tenant_id
    })
    return {
        "message": f"Deleted {result.deleted_count} queries"
    }

# Delete employee
@router.delete("/tenant/{tenant_id}/employee/{emp_id}")
def delete_employee(
    tenant_id: str,
    emp_id:    str,
    user: dict = Depends(require_superadmin)
):
    emp = users_col.find_one({
        "_id":       ObjectId(emp_id),
        "tenant_id": tenant_id
    })
    if not emp:
        raise HTTPException(404, "Employee not found")
    if emp["role"] == "admin":
        raise HTTPException(
            400, "Cannot delete organization admin"
        )
    users_col.delete_one({"_id": ObjectId(emp_id)})
    return {"message": "Employee deleted"}

# Delete tenant 
@router.delete("/tenant/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    user: dict = Depends(require_superadmin)
):
    tenant = tenants_col.find_one({
        "_id": ObjectId(tenant_id)
    })
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    # Delete Qdrant collection
    collection = tenant.get("chatbot",{}).get(
        "qdrant_collection"
    )
    if collection:
        try:
            delete_collection(collection)
        except Exception as e:
            print(f"Qdrant delete failed: {e}")

    # Delete all related data
    analytics_col.delete_many({"tenant_id": tenant_id})
    documents_col.delete_many({"tenant_id": tenant_id})
    users_col.delete_many({"tenant_id": tenant_id})
    tenants_col.delete_one({"_id": ObjectId(tenant_id)})

    return {"message": "Organization fully deleted"}

# Platform stats
@router.get("/stats")
def get_platform_stats(
    user: dict = Depends(require_superadmin)
):
    return {
        "total_tenants":   tenants_col.count_documents({}),
        "total_users":     users_col.count_documents({}),
        "total_documents": documents_col.count_documents({}),
        "total_queries":   analytics_col.count_documents({}),
    }