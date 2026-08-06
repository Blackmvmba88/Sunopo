import random
import time
from typing import List, Optional

from suno import Suno


class SunoClient:
    def __init__(self, cookie: Optional[str] = None, session_getter=None):
        # cookie can be the raw cookie string required by Suno
        self.cookie = cookie
        self.session_getter = session_getter
        self._client = None

    def _get_cookie(self):
        if self.cookie:
            return self.cookie
        if self.session_getter:
            return self.session_getter()
        raise RuntimeError("No session cookie available for Suno client")

    def _request_with_retry(
        self, func, *args, retries: int = 3, backoff_base: float = 0.5, **kwargs
    ):
        attempts = 0
        last_error = None
        while attempts < retries:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_error = e
                attempts += 1
                if attempts >= retries:
                    break
                wait = backoff_base * (2 ** (attempts - 1))
                time.sleep(wait + random.uniform(0, wait * 0.1))
        if last_error is not None:
            raise last_error
        raise RuntimeError("Request failed without an exception")

    def _get_client(self):
        if self._client is None:
            self._client = Suno(cookie=self._get_cookie())
        return self._client

    def list_songs(self, page: int = 1, limit: int = 100) -> List:
        # Basic wrapper using _request_with_retry
        client = self._get_client()
        return self._request_with_retry(client.songs.list, page=page, limit=limit)

    def iter_songs(
        self, page_size: int = 100, max_pages: int = None, start_page: int = 1
    ):
        """
        Generator that yields songs from Suno in pages. Handles retries and stops when an empty page is returned or when max_pages reached.
        """
        client = self._get_client()
        page = start_page
        pages_yielded = 0
        while True:
            if max_pages is not None and pages_yielded >= max_pages:
                break
            try:
                songs = self._request_with_retry(
                    client.songs.list, page=page, limit=page_size
                )
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

    def generate(
        self,
        prompt: str,
        is_custom: bool = False,
        tags: str = "",
        title: str = "",
        make_instrumental: bool = False,
        wait_audio: bool = True,
        model_version: str = "chirp-v3-5",
    ):
        """
        Generate music using Suno.
        """
        cookie = self._get_cookie()
        client = Suno(cookie=cookie, model_version=model_version)
        return self._request_with_retry(
            client.generate,
            prompt=prompt,
            is_custom=is_custom,
            tags=tags,
            title=title,
            make_instrumental=make_instrumental,
            wait_audio=wait_audio,
        )
