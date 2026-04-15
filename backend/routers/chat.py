from fastapi import (
    APIRouter, Depends,
    HTTPException, Header
)
from pydantic import BaseModel
from typing import List, Optional
from models.database import analytics_col, tenants_col
from services.auth_service import get_current_user
from services.rag_engine import answer_question
from datetime import datetime
from bson import ObjectId
import hashlib, time

router = APIRouter(prefix="/chat", tags=["Chat"])

class Message(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    question:     str
    chat_history: Optional[List[Message]] = []

# Internal chat
@router.post("/ask")
def ask(
    req:  ChatRequest,
    user: dict = Depends(get_current_user)
):
    if not req.question.strip():
        raise HTTPException(400, "Question is empty.")

    tenant = tenants_col.find_one({
        "_id": ObjectId(user["tenant_id"])
    })
    if not tenant:
        raise HTTPException(404, "Tenant not found")

    chatbot    = tenant.get("chatbot", {})
    collection = chatbot.get("qdrant_collection")
    prompt     = chatbot.get("system_prompt")
    name       = chatbot.get("name", "Assistant")

    if not collection:
        raise HTTPException(404, "Chatbot not configured")

    # Get user email for analytics
    from models.database import users_col
    from bson import ObjectId as ObjId
    user_doc   = users_col.find_one({
        "_id": ObjId(user["user_id"])
    }) if user.get("user_id") else None
    user_email = user_doc["email"] if user_doc else user.get("role","unknown")

    history = [
        {"role": m.role, "content": m.content}
        for m in (req.chat_history or [])
    ]

    start  = time.time()
    answer = answer_question(
        collection_name=collection,
        question=req.question,
        system_prompt=prompt,
        chat_history=history,
        chatbot_name=name
    )
    elapsed = int((time.time() - start) * 1000)

    analytics_col.insert_one({
        "tenant_id":        user["tenant_id"],
        "user_id":          user.get("user_id", ""),
        "user_email":       user_email,
        "question":         req.question,
        "answer":           answer,
        "response_time_ms": elapsed,
        "asked_by":         user.get("role", "unknown"),
        "asked_at":         datetime.utcnow()
    })

    return {
        "answer":           answer,
        "chatbot_name":     name,
        "response_time_ms": elapsed
    }

# External chat (API Key)
@router.post("/external/ask")
def external_ask(
    req:       ChatRequest,
    x_api_key: str = Header(...)
):
    if not req.question.strip():
        raise HTTPException(400, "Question is empty.")

    key_hash = hashlib.sha256(
        x_api_key.encode()
    ).hexdigest()

    tenant = tenants_col.find_one({
        "api_key_hash":   key_hash,
        "api_key_active": True
    })
    if not tenant:
        raise HTTPException(
            401, "Invalid or inactive API key."
        )

    chatbot    = tenant["chatbot"]
    collection = chatbot["qdrant_collection"]
    prompt     = chatbot.get("system_prompt")
    name       = chatbot.get("name", "Assistant")

    history = [
        {"role": m.role, "content": m.content}
        for m in (req.chat_history or [])
    ]

    start  = time.time()
    answer = answer_question(
        collection_name=collection,
        question=req.question,
        system_prompt=prompt,
        chat_history=history,
        chatbot_name=name
    )
    elapsed = int((time.time() - start) * 1000)

    analytics_col.insert_one({
        "tenant_id":        str(tenant["_id"]),
        "question":         req.question,
        "answer":           answer,
        "response_time_ms": elapsed,
        "asked_by":         "external",
        "asked_at":         datetime.utcnow()
    })

    return {
        "answer":           answer,
        "chatbot_name":     name,
        "response_time_ms": elapsed
    }

# Chat history 
@router.get("/history")
def history(
    user: dict = Depends(get_current_user)
):
    items = list(
        analytics_col.find(
            {"tenant_id": user["tenant_id"]}
        ).sort("asked_at", -1).limit(50)
    )
    for item in items:
        item["_id"]      = str(item["_id"])
        item["asked_at"] = str(item["asked_at"])

    return {"history": items, "count": len(items)}