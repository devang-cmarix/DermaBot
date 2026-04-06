from fastapi import Header, HTTPException

from ..repositories.medibot import (
    delete_auth_token,
    find_api_key,
    find_auth_token,
    find_user_by_id,
    touch_api_key_usage,
)
from ..core.security import hash_token, utc_now

def to_naive(dt):
    """Strip timezone info to match MongoDB naive datetimes."""
    return dt.replace(tzinfo=None) if dt and dt.tzinfo else dt

def get_current_user(
    authorization: str = Header(default=None),
    x_api_key: str = Header(default=None),
):
    if x_api_key:
        api_key = find_api_key(hash_token(x_api_key))
        if not api_key or api_key.get("revoked"):
            raise HTTPException(status_code=401, detail="Invalid API key.")

        user = find_user_by_id(str(api_key["user_id"]))
        if not user:
            raise HTTPException(status_code=401, detail="User not found.")

        touch_api_key_usage(api_key["key_hash"])
        return user

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing Bearer token or X-API-Key header.",
        )

    token = authorization.split(" ", 1)[1].strip()
    token_doc = find_auth_token(hash_token(token))
    if not token_doc:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    if to_naive(token_doc["expires_at"]) <= utc_now():
        delete_auth_token(token_doc["token_hash"])
        raise HTTPException(status_code=401, detail="Session token has expired.")

    user = find_user_by_id(str(token_doc["user_id"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return user
