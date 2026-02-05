import json
import pytest
from types import SimpleNamespace

from app import app, session_store


class FakeStore:
    def __init__(self):
        self._store = {}
        self.ttls = {}

    def create_session(self, cookie_str):
        token = "tkn" + str(len(self._store) + 1)
        self._store[token] = cookie_str
        self.ttls[token] = 3600
        return token

    def get_session(self, token):
        return self._store.get(token)

    def revoke(self, token):
        if token in self._store:
            del self._store[token]

    def ttl(self, token):
        return self.ttls.get(token, -2)


def test_create_and_validate_session(monkeypatch):
    fake = FakeStore()
    monkeypatch.setattr("app.session_store", fake)

    with app.test_client() as c:
        rv = c.post("/api/session", json={"session_id": "cookie_string"})
        assert rv.status_code == 200
        data = rv.get_json()
        assert "session_token" in data
        token = data["session_token"]
        # cookie set
        assert "SUNOPO_SESSION_TOKEN" in rv.headers.get("Set-Cookie")

        # validate via cookie
        c.set_cookie("localhost", "SUNOPO_SESSION_TOKEN", token)
        rv2 = c.get("/api/session/validate")
        d2 = rv2.get_json()
        assert d2["valid"] is True

        # revoke
        rv3 = c.delete(f"/api/session/{token}")
        assert rv3.status_code == 200
        rv4 = c.get("/api/session/validate")
        assert rv4.get_json()["valid"] is False
