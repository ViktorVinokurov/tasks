from datetime import timedelta

import bcrypt
import jwt
from jwt import InvalidTokenError

from app.config import get_settings
from app.support import utcnow

_DUMMY_HASH: bytes | None = None


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str | None) -> bool:
    hashed = password_hash.encode() if password_hash else _dummy_hash()
    try:
        return bcrypt.checkpw(password.encode(), hashed)
    except ValueError:
        return False


def create_access_token(user_id: str) -> str:
    settings = get_settings()
    expires = utcnow() + timedelta(days=settings.jwt_ttl_days)
    return jwt.encode(
        {"sub": user_id, "exp": expires},
        settings.jwt_secret,
        algorithm="HS256",
    )


def read_user_id(token: str) -> str | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except InvalidTokenError:
        return None
    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        return None
    return subject


def _dummy_hash() -> bytes:
    global _DUMMY_HASH
    if _DUMMY_HASH is None:
        _DUMMY_HASH = bcrypt.hashpw(b"not-a-user", bcrypt.gensalt())
    return _DUMMY_HASH
