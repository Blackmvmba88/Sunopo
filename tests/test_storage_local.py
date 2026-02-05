import os
from io import BytesIO
from storage.local import LocalStorage


def test_local_save_and_exists(tmp_path):
    ls = LocalStorage(tmp_path)
    data = BytesIO(b"hello")
    path = ls.save("folder/file.bin", data)
    assert ls.exists("folder/file.bin")
    assert os.path.exists(path)
