import json
import pytest
from types import SimpleNamespace

from app import app


def make_fake_songs(n):
    return [
        SimpleNamespace(
            id=f"id_{i}",
            title=f"title_{i}",
            image_url=None,
            audio_url=None,
            video_url=None,
            created_at=None,
            status="complete",
            prompt=None,
            lyrics="",
        )
        for i in range(n)
    ]


def test_api_songs_page(monkeypatch):
    # Fake SunoClient methods
    class FakeClient:
        def __init__(self, cookie=None, session_getter=None):
            pass

        def list_songs(self, page=1, limit=50):
            start = (page - 1) * limit
            return (
                make_fake_songs(limit)[start : start + limit]
                if limit <= 50
                else make_fake_songs(0)
            )

    monkeypatch.setattr("app.SunoClient", FakeClient)

    with app.test_client() as c:
        rv = c.get("/api/songs?page=1&per_page=2")
        assert rv.status_code == 200
        data = rv.get_json()
        assert "items" in data
        assert data["page"] == 1
        assert data["per_page"] == 2


def test_api_songs_all(monkeypatch):
    class FakeClient:
        def __init__(self, cookie=None, session_getter=None):
            pass

        def iter_songs(self, page_size=100, max_pages=None, start_page=1):
            # yield 3 items
            for i in range(3):
                yield SimpleNamespace(
                    id=f"id_{i}",
                    title=f"t{i}",
                    image_url=None,
                    audio_url=None,
                    video_url=None,
                    created_at=None,
                    status="complete",
                    prompt=None,
                    lyrics="",
                )

    monkeypatch.setattr("app.SunoClient", FakeClient)

    with app.test_client() as c:
        rv = c.get("/api/songs?all=true&per_page=2")
        assert rv.status_code == 200
        data = rv.get_json()
        assert "items" in data
        assert len(data["items"]) == 3
        assert data["has_more"] is False
