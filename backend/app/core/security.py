import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone


TOKEN_TTL_DAYS = 7


def utc_now():
    return datetime.utcnow()


def hash_password(password: str, salt: str | None = None):
    password_salt = salt or secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        100_000,
    )
    return password_salt, derived_key.hex()


def verify_password(password: str, salt: str, expected_hash: str):
    _, password_hash = hash_password(password, salt)
    return hmac.compare_digest(password_hash, expected_hash)


def create_session_token():
    raw_token = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = utc_now() + timedelta(days=TOKEN_TTL_DAYS)
    return raw_token, token_hash, expires_at


def create_api_key():
    raw_key = f"mb_live_{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    return raw_key, key_hash


def hash_token(token: str):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
