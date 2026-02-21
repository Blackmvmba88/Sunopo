import os
import time
from cryptography.fernet import Fernet
from sessions import SessionStore


def test_session_integration_real_redis():
    redis_url = os.environ.get("REDIS_URL")
    assert redis_url, "REDIS_URL not set for integration test"
    key = os.environ.get("SESSION_FERNET_KEY") or Fernet.generate_key().decode()

    store = SessionStore(redis_url=redis_url, ttl=5, fernet_key=key)
    token = store.create_session("cookie-data")
    assert token

    cookie = store.get_session(token)
    assert cookie == "cookie-data"

    # TTL should be >0 initially
    t = store.ttl(token)
    assert t >= 0

    # wait for expiry
    time.sleep(6)
    cookie2 = store.get_session(token)
    assert cookie2 is None
