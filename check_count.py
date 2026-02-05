import os
from suno import Suno

from config import read_session_id
from suno_client import SunoClient


def count_songs():
    try:
        session_id = read_session_id()
        client = SunoClient(cookie=session_id, session_getter=read_session_id)
        songs = client.list_songs(page=1, limit=1)

        print(f"Songs object type: {type(songs)}")
        print(f"Number of songs in first fetch: {len(songs)}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    count_songs()
