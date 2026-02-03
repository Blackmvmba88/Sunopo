import pytest
from suno_client import SunoClient

class DummySong:
    def __init__(self, id, title='t'):
        self.id = id
        self.title = title
        self.status = 'complete'
        self.created_at = '2024-01-01'
        self.audio_url = '#'

class DummyClient:
    def __init__(self, songs_per_page=3):
        self._songs = [DummySong(f'id_{i}') for i in range(songs_per_page)]
    def songs(self):
        return self
    def list(self, page=1, limit=100):
        return self._songs


def test_get_song_monkeypatch(monkeypatch):
    # Patch Suno constructor used inside SunoClient
    from suno_client import SunoClient

    def fake_suno(cookie=None):
        class C:
            def __init__(self):
                pass
            class songs:
                @staticmethod
                def list(page=1, limit=100):
                    return [DummySong('abc'), DummySong('def')]
        return C()

    monkeypatch.setattr('suno.Suno', fake_suno)
    client = SunoClient(cookie='abc')
    song = client.get_song('def')
    assert song is not None
    assert song.id == 'def'
