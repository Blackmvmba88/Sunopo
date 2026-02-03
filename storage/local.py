from pathlib import Path
from typing import BinaryIO
import shutil

class LocalStorage:
    def __init__(self, base_path: Path):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def save(self, key: str, data: BinaryIO) -> str:
        dest = self.base_path / key
        # Ensure parent
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, 'wb') as f:
            shutil.copyfileobj(data, f)
        return str(dest)

    def exists(self, key: str) -> bool:
        return (self.base_path / key).exists()

    def get_path(self, key: str) -> str:
        return str(self.base_path / key)
