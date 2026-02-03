from typing import List, Optional
from suno import Suno
import time

class SunoClient:
    def __init__(self, cookie: Optional[str] = None, session_getter=None):
        # cookie can be the raw cookie string required by Suno
        self.cookie = cookie
        self.session_getter = session_getter

    def _get_cookie(self):
        if self.cookie:
            return self.cookie
        if self.session_getter:
            return self.session_getter()
        raise RuntimeError('No session cookie available for Suno client')

    def list_songs(self, page: int = 1, limit: int = 100) -> List:
        # Basic wrapper with simple retry
        cookie = self._get_cookie()
        client = Suno(cookie=cookie)
        attempts = 0
        while attempts < 3:
            try:
                return client.songs.list(page=page, limit=limit)
            except Exception:
                attempts += 1
                time.sleep(1)
        raise

    def get_song(self, song_id: str):
        # Bruteforce search by pages (caller should handle large volumes)
        page = 1
        while True:
            songs = self.list_songs(page=page, limit=100)
            if not songs:
                return None
            found = next((s for s in songs if s.id == song_id), None)
            if found:
                return found
            page += 1
