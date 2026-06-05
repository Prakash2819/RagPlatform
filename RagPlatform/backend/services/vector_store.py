from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct
)
from sentence_transformers import SentenceTransformer
import uuid, os
from dotenv import load_dotenv

load_dotenv()

print("Connecting to Qdrant Cloud...")
qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)
print("✅ Qdrant connected!")

print("Loading embedding model...")
embedder    = SentenceTransformer("all-MiniLM-L6-v2")
VECTOR_SIZE = 384
print("✅ Embedding model ready!")

#  Create collection 
def create_collection() -> str:
    name = f"tenant_{uuid.uuid4().hex[:12]}"

    existing = [
        c.name for c in
        qdrant.get_collections().collections
    ]

    if name not in existing:
        qdrant.create_collection(
            collection_name=name,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE
            )
        )
        print(f"✅ Collection created: {name}")

    return name

#  Store chunks 
def store_chunks(
    collection_name: str,
    chunks: list,
    metadata: dict
) -> int:
    if not chunks:
        return 0

    vectors = embedder.encode(chunks).tolist()

    points = [
        PointStruct(
            id=str(uuid.uuid4()),
            vector=vector,
            payload={
                "text":   chunk,
                "source": metadata.get("filename", "")
            }
        )
        for chunk, vector in zip(chunks, vectors)
    ]

    qdrant.upsert(
        collection_name=collection_name,
        points=points
    )
    print(f"✅ Stored {len(points)} chunks")
    return len(points)

# Search chunks
def search_chunks(
    collection_name: str,
    query: str,
    top_k: int = 3
) -> list:
    query_vector = embedder.encode(query).tolist()

    # qdrant-client v1.7+ uses query_points
    results = qdrant.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=top_k
    )

    return [
        hit.payload["text"]
        for hit in results.points
    ]

#  Delete collection
def delete_collection(collection_name: str):
    try:
        qdrant.delete_collection(collection_name)
        print(f"✅ Deleted: {collection_name}")
    except Exception as e:
        print(f"Delete failed: {e}")