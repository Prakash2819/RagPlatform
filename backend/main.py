from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from routers import auth, tenant,superadmin,chat,documents

load_dotenv()

app = FastAPI(
    title="RAG Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tenant.router)
app.include_router(superadmin.router)
app.include_router(chat.router)
app.include_router(documents.router)

@app.get("/health")
def health():
    return {
        "status":  "ok",
        "message": "RAG Platform running!"
    }