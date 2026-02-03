import uuid
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
import redis
from config import REDIS_URL, SESSION_TTL_SECONDS, SESSION_FERNET_KEY


class SessionStore:
    def __init__(self, redis_url: str = None, ttl: int = 86400, fernet_key: Optional[str] = None):
        self.ttl = ttl
        if redis_url:
            self.client = redis.from_url(redis_url)
        else:
            self.client = None

        if fernet_key:
            self.fernet = Fernet(fernet_key.encode() if isinstance(fernet_key, str) else fernet_key)
        else:
            self.fernet = None
            # Warn at runtime if encryption is not configured
            print("Warning: SESSION_FERNET_KEY not set. Session values will be stored in Redis unencrypted.")

    def _encrypt(self, data: str) -> str:
        if not self.fernet:
            return data
        return self.fernet.encrypt(data.encode()).decode()

    def _decrypt(self, token: str) -> str:
        if not self.fernet:
            return token
        try:
            return self.fernet.decrypt(token.encode()).decode()
        except InvalidToken:
            return None

    def create_session(self, cookie_str: str) -> str:
        if not self.client:
            raise RuntimeError("Redis client not configured")
        token = uuid.uuid4().hex
        value = self._encrypt(cookie_str)
        self.client.setex(token, self.ttl, value)
        return token

    def get_session(self, token: str) -> Optional[str]:
        if not self.client:
            return None
        val = self.client.get(token)
        if not val:
            return None
        val = val.decode() if isinstance(val, bytes) else val
        return self._decrypt(val)

    def revoke(self, token: str) -> None:
        if not self.client:
            return
        self.client.delete(token)

    def ttl(self, token: str) -> int:
        if not self.client:
            return -2
        try:
            return self.client.ttl(token)
        except Exception:
            return -2
