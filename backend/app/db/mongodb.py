import os
from functools import lru_cache

from fastapi import HTTPException

try:
    from pymongo import ASCENDING, DESCENDING, MongoClient
except ImportError:  # pragma: no cover - handled at runtime
    ASCENDING = 1
    DESCENDING = -1
    MongoClient = None


MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "medibot")


def _missing_driver_error() -> HTTPException:
    return HTTPException(
        status_code=500,
        detail="MongoDB support is not installed. Install backend requirements first.",
    )


@lru_cache(maxsize=1)
def get_client():
    if MongoClient is None:
        raise _missing_driver_error()

    try:
        client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        client.admin.command("ping")
        return client
    except Exception as exc:  # pragma: no cover - depends on local MongoDB
        raise HTTPException(
            status_code=500,
            detail=f"Could not connect to MongoDB: {exc}",
        ) from exc


def get_database():
    return get_client()[MONGODB_DB_NAME]


def ensure_indexes():
    db = get_database()
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.user_settings.create_index([("user_id", ASCENDING)], unique=True)
    db.chat_sessions.create_index([("user_id", ASCENDING), ("updated_at", DESCENDING)])
    db.messages.create_index([("session_id", ASCENDING), ("created_at", ASCENDING)])
    db.auth_tokens.create_index([("token_hash", ASCENDING)], unique=True)
    db.auth_tokens.create_index([("expires_at", ASCENDING)], expireAfterSeconds=0)
    db.api_keys.create_index([("key_hash", ASCENDING)], unique=True)
    db.api_keys.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
