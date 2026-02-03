import os
from config import EXPORTS_DIR, REPORTS_DIR, SESSION_ID_PATH

def test_paths_are_paths():
    assert EXPORTS_DIR.exists() or EXPORTS_DIR.parent.exists()
    assert REPORTS_DIR.exists() or REPORTS_DIR.parent.exists()
    assert SESSION_ID_PATH is not None
