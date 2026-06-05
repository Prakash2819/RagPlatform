from fastapi import (
    APIRouter, UploadFile,
    File, Depends, HTTPException
)
from models.database import documents_col, tenants_col
from services.auth_service import get_current_user
from services.rag_engine import process_document
from datetime import datetime
from bson import ObjectId

router = APIRouter(
    prefix="/documents", tags=["Documents"]
)

ALLOWED = ["pdf", "txt", "docx"]

# Upload
@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED:
        raise HTTPException(
            400, f"Only {ALLOWED} files allowed."
        )

    # Get tenant's Qdrant collection
    tenant = tenants_col.find_one({
        "_id": ObjectId(user["tenant_id"])
    })
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    collection = tenant["chatbot"]["qdrant_collection"]

    # Save record as processing
    doc = {
        "tenant_id":   user["tenant_id"],
        "filename":    file.filename,
        "status":      "processing",
        "uploaded_by": user.get("user_id", ""),
        "uploaded_at": datetime.utcnow()
    }
    doc_id = str(
        documents_col.insert_one(doc).inserted_id
    )

    try:
        file_bytes = await file.read()
        result     = process_document(
            file_bytes=file_bytes,
            filename=file.filename,
            collection_name=collection
        )

        documents_col.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status":         "ready",
                "chunks_created": result["chunks_created"],
                "total_chars":    result["total_chars"]
            }}
        )

        return {
            "message":        "Document processed!",
            "filename":       file.filename,
            "chunks_created": result["chunks_created"],
            "status":         "ready"
        }

    except Exception as e:
        documents_col.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {
                "status": "failed",
                "error":  str(e)
            }}
        )
        raise HTTPException(
            500, f"Processing failed: {str(e)}"
        )

# List documents 
@router.get("/list")
def list_docs(
    user: dict = Depends(get_current_user)
):
    docs = list(documents_col.find(
        {"tenant_id": user["tenant_id"]}
    ))
    for doc in docs:
        doc["_id"]         = str(doc["_id"])
        doc["uploaded_at"] = str(doc["uploaded_at"])
    return {"documents": docs, "count": len(docs)}

# Delete document
@router.delete("/{doc_id}")
def delete_doc(
    doc_id: str,
    user:   dict = Depends(get_current_user)
):
    doc = documents_col.find_one({
        "_id":       ObjectId(doc_id),
        "tenant_id": user["tenant_id"]
    })
    if not doc:
        raise HTTPException(404, "Document not found")

    documents_col.delete_one({"_id": ObjectId(doc_id)})
    return {"message": f"'{doc['filename']}' deleted."}