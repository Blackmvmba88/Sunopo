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
        raise RuntimeError("No session cookie available for Suno client")

    def _request_with_retry(self, func, *args, retries: int = 3, backoff_base: float = 0.5, **kwargs):
        attempts = 0
        while attempts < retries:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                attempts += 1
                wait = backoff_base * (2 ** (attempts - 1))
                # add jitter
                time.sleep(wait + (0.1 * attempts))
        raise

    def list_songs(self, page: int = 1, limit: int = 100) -> List:
        # Basic wrapper using _request_with_retry
        cookie = self._get_cookie()
        client = Suno(cookie=cookie)
        return self._request_with_retry(client.songs.list, page=page, limit=limit)

    def iter_songs(self, page_size: int = 100, max_pages: int = None, start_page: int = 1):
        """
        Generator that yields songs from Suno in pages. Handles retries and stops when an empty page is returned or when max_pages reached.
        """
        cookie = self._get_cookie()
        client = Suno(cookie=cookie)
        page = start_page
        pages_yielded = 0
        while True:
            if max_pages is not None and pages_yielded >= max_pages:
                break
            try:
                songs = self._request_with_retry(client.songs.list, page=page, limit=page_size)
            except Exception:
                # Bubble up - caller may choose to handle
                raise

            if not songs:
                break

            for s in songs:
                yield s

            pages_yielded += 1
            # If the returned page is smaller than page_size, it's the last page
            if len(songs) < page_size:
                break
            page += 1

    def get_song(self, song_id: str):
        # Bruteforce search by pages (caller should handle large volumes)
        for s in self.iter_songs(page_size=100):
            if s.id == song_id:
                return s
        return None
