import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Tuple

from jose import jwt
from passlib.context import CryptContext

from app.config import get_settings

settings = get_settings()

# Argon2 per the project's security spec (Argon2 or bcrypt password hashing).
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(user_id: uuid.UUID, role: str) -> Tuple[str, datetime]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",
        "iat": now,
        "exp": expires_at,
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return token, expires_at


def decode_access_token(token: str) -> dict:
    # Raises jose.JWTError on an invalid signature, malformed token, or expiry.
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(raw_token: str) -> str:
    # Refresh tokens are opaque (not JWTs): only the hash is ever persisted,
    # so a leaked database dump doesn't hand out usable tokens.
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
