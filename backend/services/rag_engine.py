import os
import tempfile
from groq import Groq
from pypdf import PdfReader
from docx2txt import process as docx_process
from services.vector_store import (
    store_chunks,
    search_chunks
)
from dotenv import load_dotenv

load_dotenv()


client     = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.1-8b-instant"

print(f"✅ LLM: Groq — {GROQ_MODEL}")

# Groq LLM 
def call_llm(messages: list) -> str:
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=1024,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Groq error: {e}")
        return "I'm sorry, I'm having trouble responding right now. Please try again in a moment."

# Extract text 
def extract_text(
    file_bytes: bytes,
    filename: str
) -> str:
    ext = filename.split(".")[-1].lower()

    if ext == "pdf":
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=".pdf"
        ) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        reader = PdfReader(tmp_path)
        text   = "".join(
            page.extract_text() or ""
            for page in reader.pages
        )
        os.unlink(tmp_path)
        return text

    elif ext == "docx":
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=".docx"
        ) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name
        text = docx_process(tmp_path)
        os.unlink(tmp_path)
        return text

    elif ext == "txt":
        return file_bytes.decode(
            "utf-8", errors="ignore"
        )

    raise ValueError(
        f"Unsupported file: .{ext}. "
        f"Only PDF, DOCX, TXT allowed."
    )

#  Split text 
def split_text(
    text: str,
    chunk_size: int = 500
) -> list:
    text      = " ".join(text.split())
    sentences = text.replace("\n", " ").split(". ")
    chunks    = []
    current   = ""

    for sentence in sentences:
        if len(current) + len(sentence) > chunk_size:
            if current.strip():
                chunks.append(current.strip())
            current = sentence + ". "
        else:
            current += sentence + ". "

    if current.strip():
        chunks.append(current.strip())

    return [c for c in chunks if len(c) > 30]

# Process document 
def process_document(
    file_bytes: bytes,
    filename: str,
    collection_name: str
) -> dict:
    print(f"\nProcessing: {filename}")

    text = extract_text(file_bytes, filename)
    if not text.strip():
        raise ValueError("No text found in document")

    chunks = split_text(text)
    if not chunks:
        raise ValueError("Could not split document")

    from datetime import datetime
    count = store_chunks(
        collection_name=collection_name,
        chunks=chunks,
        metadata={
            "filename":    filename,
            "uploaded_at": str(datetime.utcnow())
        }
    )

    return {
        "filename":       filename,
        "chunks_created": count,
        "total_chars":    len(text),
        "status":         "success"
    }
# Answer question 
def answer_question(
    collection_name: str,
    question: str,
    system_prompt: str = None,
    chat_history: list = None,
    chatbot_name: str = "Assistant"
) -> str:


    chunks = search_chunks(
        collection_name=collection_name,
        query=question,
        top_k=3
    )


    if system_prompt:
        base_personality = system_prompt
    else:
        base_personality = (
            f"You are {chatbot_name}, "
            f"a friendly and helpful assistant."
        )

    if chunks:
        context = "\n\n".join(chunks)
        system_message = f"""{base_personality}

You are a helpful assistant answering questions 
on behalf of the organization.

STRICT RULES — NEVER BREAK THESE:
1. You are the ASSISTANT talking ABOUT people or topics
   — you are NOT the person in the document
2. NEVER say "I have", "I've worked", "I gained",
   "I am", "my experience" as if you are the subject
3. Always refer to people in third person:
   "He has...", "She knows...", "They worked...",
   "Sakthivel has...", "The candidate..."
4. NEVER mention documents, files, uploads, or context
5. If something is not known, say it naturally:
   "That detail isn't available"
   "I don't have that information"
   "That's not mentioned"
6. Be warm, conversational and natural
7. Keep answers clear and to the point
8. Never sound robotic or list everything mechanically

Use this information to answer:
{context}"""

    else:
        system_message = f"""{base_personality}

You are a helpful assistant.

STRICT RULES:
1. You are the ASSISTANT — not the subject being asked about
2. NEVER say "I have", "I've worked" as if you are the person
3. NEVER mention documents, files, or uploads
4. If you don't know, say naturally:
   "I don't have that information right now"
   "That detail isn't available to me"
5. Be warm and conversational
6. Never sound robotic"""

    messages = [
        {
            "role":    "system",
            "content": system_message
        }
    ]

    if chat_history:
        for msg in chat_history[-6:]:
            messages.append({
                "role":    msg["role"],
                "content": msg["content"]
            })

    messages.append({
        "role":    "user",
        "content": question
    })


    return call_llm(messages)