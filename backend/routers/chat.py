from fastapi import (
    APIRouter, Depends,
    HTTPException, Header,
    WebSocket, WebSocketDisconnect
)
from pydantic import BaseModel
from typing import List, Optional
from models.database import (
    analytics_col, tenants_col, users_col
)
from services.auth_service import get_current_user
from services.rag_engine import (
    answer_question,
    answer_question_stream
)
from datetime import datetime
from bson import ObjectId
import hashlib, time, json

router = APIRouter(prefix="/chat", tags=["Chat"])

class Message(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    question:     str
    chat_history: Optional[List[Message]] = []

# ── WebSocket chat (real-time streaming) ──────────
@router.websocket("/ws/{tenant_id}")
async def websocket_chat(
    websocket: WebSocket,
    tenant_id: str
):
    await websocket.accept()
    print(f"✅ WebSocket connected: tenant {tenant_id}")

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            payload = json.loads(data)

            question     = payload.get("question", "").strip()
            token        = payload.get("token", "")
            chat_history = payload.get("chat_history", [])
            api_key      = payload.get("api_key", "")

            if not question:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Question is empty"
                }))
                continue

            # ── Identify user ──────────────────────
            tenant    = None
            user_email= "external"
            user_id   = ""
            asked_by  = "external"

            if token:
                # JWT user (admin or member)
                try:
                    from services.auth_service import decode_token
                    user = decode_token(token)
                    tenant = tenants_col.find_one({
                        "_id": ObjectId(user["tenant_id"])
                    })
                    user_doc = users_col.find_one({
                        "_id": ObjectId(user.get("user_id",""))
                    })
                    user_email = user_doc["email"] if user_doc else user.get("role","unknown")
                    user_id    = user.get("user_id","")
                    asked_by   = user.get("role","unknown")
                except Exception as e:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid token"
                    }))
                    continue

            elif api_key:
                # External API key user
                key_hash = hashlib.sha256(
                    api_key.encode()
                ).hexdigest()
                tenant = tenants_col.find_one({
                    "api_key_hash":   key_hash,
                    "api_key_active": True
                })
                if not tenant:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid API key"
                    }))
                    continue

            else:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "No authentication provided"
                }))
                continue

            if not tenant:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Organization not found"
                }))
                continue

            chatbot    = tenant.get("chatbot", {})
            collection = chatbot.get("qdrant_collection")
            prompt     = chatbot.get("system_prompt")
            name       = chatbot.get("name", "Assistant")

            if not collection:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Chatbot not configured. Upload documents first."
                }))
                continue

            # ── Send start signal ──────────────────
            await websocket.send_text(json.dumps({
                "type":         "start",
                "chatbot_name": name
            }))

            # ── Stream answer word by word ─────────
            start      = time.time()
            full_answer= ""

            try:
                async for chunk in answer_question_stream(
                    collection_name=collection,
                    question=question,
                    system_prompt=prompt,
                    chat_history=chat_history,
                    chatbot_name=name
                ):
                    full_answer += chunk
                    await websocket.send_text(json.dumps({
                        "type":  "chunk",
                        "chunk": chunk
                    }))

            except Exception as e:
                error_msg = "Sorry, I had trouble responding. Please try again."
                await websocket.send_text(json.dumps({
                    "type":  "chunk",
                    "chunk": error_msg
                }))
                full_answer = error_msg

            elapsed = int((time.time() - start) * 1000)

            # ── Send done signal ───────────────────
            await websocket.send_text(json.dumps({
                "type":             "done",
                "response_time_ms": elapsed
            }))

            # ── Save to analytics ──────────────────
            try:
                analytics_col.insert_one({
                    "tenant_id":        str(tenant["_id"]),
                    "user_id":          user_id,
                    "user_email":       user_email,
                    "question":         question,
                    "answer":           full_answer,
                    "response_time_ms": elapsed,
                    "asked_by":         asked_by,
                    "asked_at":         datetime.utcnow()
                })
            except Exception as e:
                print(f"Analytics save failed: {e}")

    except WebSocketDisconnect:
        print(f"WebSocket disconnected: tenant {tenant_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_text(json.dumps({
                "type":    "error",
                "message": str(e)
            }))
        except:
            pass

# ── Regular HTTP chat (fallback) ──────────────────
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

    user_doc   = users_col.find_one({
        "_id": ObjectId(user.get("user_id",""))
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
        "user_id":          user.get("user_id",""),
        "user_email":       user_email,
        "question":         req.question,
        "answer":           answer,
        "response_time_ms": elapsed,
        "asked_by":         user.get("role","unknown"),
        "asked_at":         datetime.utcnow()
    })

    return {
        "answer":           answer,
        "chatbot_name":     name,
        "response_time_ms": elapsed
    }

# ── External HTTP chat (API Key fallback) ─────────
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
        raise HTTPException(401, "Invalid API key.")

    chatbot    = tenant["chatbot"]
    collection = chatbot["qdrant_collection"]
    prompt     = chatbot.get("system_prompt")
    name       = chatbot.get("name","Assistant")

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
        "answer":  answer,
        "chatbot_name": name,
        "response_time_ms": elapsed
    }

# ── Chat history ───────────────────────────────────
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