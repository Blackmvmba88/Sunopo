import pytest
from types import SimpleNamespace

from suno_client import SunoClient


class FakeSuno:
    def __init__(self, pages):
        self._pages = pages

    class songs:
        @staticmethod
        def list(page=1, limit=100):
            return []


def test_iter_songs_multiple_pages(monkeypatch):
    pages = [
        [SimpleNamespace(id=f"id_{i + j * 3}", title="t") for i in range(3)]
        for j in range(3)
    ]

    def fake_suno_factory(cookie=None):
        class C:
            def __init__(self):
                self._calls = 0

            class songs:
                @staticmethod
                def list(page=1, limit=100):
                    # page starts at 1
                    p = page - 1
                    if p < 0 or p >= len(pages):
                        return []
                    return pages[p]

        return C()

    monkeypatch.setattr("suno_client.Suno", fake_suno_factory)
    client = SunoClient(cookie="abc")

    results = list(client.iter_songs(page_size=3))
    assert len(results) == 9
    assert results[0].id == "id_0"
    assert results[-1].id == "id_2"


def test_iter_songs_empty_page(monkeypatch):
    # First page empty
    def fake_suno_factory(cookie=None):
        class C:
            class songs:
                @staticmethod
                def list(page=1, limit=100):
                    return []

        return C()

    monkeypatch.setattr("suno_client.Suno", fake_suno_factory)
    client = SunoClient(cookie="abc")
    results = list(client.iter_songs(page_size=10))
    assert results == []


def test_request_with_retry_transient(monkeypatch):
    call_count = {"n": 0}

    def fake_suno_factory(cookie=None):
        class C:
            class songs:
                @staticmethod
                def list(page=1, limit=100):
                    call_count["n"] += 1
                    if call_count["n"] == 1:
                        raise Exception("transient")
                    return [SimpleNamespace(id="ok")]

        return C()

    monkeypatch.setattr("suno_client.Suno", fake_suno_factory)
    client = SunoClient(cookie="abc")
    results = list(client.iter_songs(page_size=10))
    assert len(results) == 1
    assert results[0].id == "ok"
