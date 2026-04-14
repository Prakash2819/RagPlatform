from pymongo import MongoClient, ASCENDING
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise Exception("MONGODB_URL missing in .env!")

print("Connecting to MongoDB Atlas...")
client = MongoClient(MONGODB_URL)

try:
    client.admin.command("ping")
    print("✅ MongoDB connected!")
except Exception as e:
    print(f"❌ MongoDB failed: {e}")
    raise e

db = client["ragplatform"]

# Collections
tenants_col   = db["tenants"]
users_col     = db["users"]
documents_col = db["documents"]
analytics_col = db["analytics"]

def create_indexes():
    users_col.create_index(
        [("email", ASCENDING)], unique=True
    )
    users_col.create_index([("tenant_id", ASCENDING)])
    tenants_col.create_index(
        [("domain", ASCENDING)], unique=True
    )
    tenants_col.create_index(
        [("api_key_hash", ASCENDING)]
    )
    documents_col.create_index([("tenant_id", ASCENDING)])
    analytics_col.create_index([("tenant_id", ASCENDING)])
    print("✅ Indexes created!")

create_indexes()