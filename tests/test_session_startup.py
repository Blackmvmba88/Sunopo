import logging

from redis.exceptions import RedisError

import app as app_module
from sessions import SessionStore


def test_required_session_config_is_available_to_app():
    assert isinstance(app_module.REDIS_URL, str)
    assert isinstance(app_module.SESSION_TTL_SECONDS, int)
    assert hasattr(app_module, "SESSION_FERNET_KEY")


def test_real_session_store_keeps_ttl_method_callable():
    store = SessionStore(redis_url=None, ttl=123, fernet_key=None)

    assert store.ttl_seconds == 123
    assert callable(store.ttl)
    assert store.ttl("missing") == -2


def test_startup_logs_configuration_errors_separately(monkeypatch, caplog):
    class InvalidConfigStore:
        def __init__(self, **kwargs):
            raise ValueError("invalid session configuration")

    monkeypatch.setattr(app_module, "SessionStore", InvalidConfigStore)

    with caplog.at_level(logging.ERROR):
        assert app_module.initialize_session_store() is None

    assert "Session store configuration error" in caplog.text


def test_startup_logs_redis_connectivity_errors_separately(monkeypatch, caplog):
    class OfflineClient:
        def ping(self):
            raise RedisError("redis unavailable")

    class OfflineStore:
        def __init__(self, **kwargs):
            self.client = OfflineClient()

    monkeypatch.setattr(app_module, "SessionStore", OfflineStore)

    with caplog.at_level(logging.WARNING):
        assert app_module.initialize_session_store() is None

    assert "Session store Redis connectivity error" in caplog.text
