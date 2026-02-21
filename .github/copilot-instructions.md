# GitHub Copilot instructions for Sunopo ✅

Purpose

- Short: Help an AI coding agent be productive immediately in this repository.
- Quick context: This repo contains a small Flask backend (`app.py`), a static frontend (`index.html`, `script.js`), automation user-scripts (`suno_sovereign_link.user.js`, `soundcloud_automation.js`), and sync/reporting scripts (`master_sync.py`, `check_count.py`). Key integrations: Suno API (via session cookie), Spotipy (optional), and local file exports/reports.

What to check first (actionable, in order)

1. Inspect `app.py` and `script.js` to learn runtime behavior (Dev server: Flask, debug=True, port=5555). Frontend expects `API_URL = 'http://localhost:5555/api'`.
2. Locate the Suno session path constant (`SESSION_ID_PATH`) used by `app.py` and `master_sync.py`. By default it uses `/Users/blackmamba/suno_downloader/suno_session.txt`—this must exist or be provided by the user/Tampermonkey script.
3. Check for system deps: `pydub` requires ffmpeg installed on macOS (`brew install ffmpeg`).
4. Confirm missing dependency manifest (`requirements.txt` or `pyproject.toml`). If absent, ask whether to add one and which Python version to target.
5. Review `reports/` and `exports/` locations. Paths are currently absolute (macOS /Users/blackmamba/...), so update constants when running in a different environment.

Local development quickstart (concise)

- Create a Python virtual environment, activate it, and install project deps (example):
  1. python -m venv .venv && source .venv/bin/activate
  2. brew install ffmpeg (macOS)
  3. pip install flask flask_cors requests pydub pandas spotipy openpyxl
- Start dev server: `python app.py` (listens on port 5555)
- Open `index.html` in a browser (or go to http://localhost:5555) and click "Sincronizar Suno" to exercise `/api/songs`.

Session handling & automation 🔐

- Session cookie is required for Suno API access. Preferred secure flow:
  1. Use `suno_sovereign_link.user.js` (Tampermonkey) on `suno.com` to POST the full cookie string to `http://localhost:5555/api/session`. The server stores it in Redis (server-side) and returns a short-lived `session_token` set as an HttpOnly cookie `SUNOPO_SESSION_TOKEN`.
  2. Clients may call APIs using the `X-Session-Token` header, `Authorization: Bearer <token>`, or the `SUNOPO_SESSION_TOKEN` cookie.
  3. Backwards compatibility: `/api/update_session` writes to the local session file (`SESSION_ID_PATH`) when needed.

- Resolution order and implementation notes:
  - `app.get_session_id()` resolves tokens in this order: cookie -> Authorization header -> `X-Session-Token` header -> query param `token` -> fallback to the session file read by `config.read_session_id()`.
  - `sessions.SessionStore` uses Redis and optional Fernet (`SESSION_FERNET_KEY`) to encrypt stored cookie values. If `SESSION_FERNET_KEY` is unset, values are stored in plaintext (runtime prints a warning).

- Security & key generation:
  - **Always** set `SESSION_FERNET_KEY` in production. Generate one locally with:
    ```bash
    python tools/generate_fernet_key.py
    export SESSION_FERNET_KEY="$(python tools/generate_fernet_key.py)"
    ```
  - Treat the session cookie as a secret. Add `exports/`, `reports/` and any session files to `.gitignore` and never commit them.

- Local dev / Redis / integration tests:
  - There's a `docker-compose.yml` that launches Redis for local development: `docker-compose up -d`.
  - Integration tests (e.g., `tests/test_session_integration.py`) require `REDIS_URL` to be set and a `SESSION_FERNET_KEY` present in the environment. In CI, ensure Redis is available as a service and `SESSION_FERNET_KEY` is set via secrets.

- Suno client usage pattern:
  - Prefer `SunoClient.iter_songs()` for streaming large libraries (used in `master_sync.py`) to avoid loading all pages into memory at once. Unit tests show how to monkeypatch `suno.Suno` for offline testing.

- Note on absolute paths: by default `SESSION_ID_PATH` points to `/Users/blackmamba/suno_downloader/suno_session.txt`—update `SUNO_SESSION_ID_PATH` or `SUNOPO_BASE_DIR` in `config.py` or via env vars when running on another machine.

Key workflows & scripts (what they do)

- `app.py` — Flask API endpoints: `/api/songs`, `/api/generate_wav/<id>`, `/api/analyze_track/<id>`, `/api/update_session`, `/api/download/<id>`; uses Suno client and `pydub` to convert audio.
- `script.js` — Frontend interactions and expectations; copies generated descriptions to clipboard and opens SoundCloud upload page.
- `suno_sovereign_link.user.js` — Tampermonkey script to auto-send session cookie and optionally auto-scroll to load library tracks.
- `soundcloud_automation.js` — Console snippet to auto-fill SoundCloud metadata fields.
- `master_sync.py` — Generates Excel reports (`reports/`) from Suno (and local SoundCloud/Spotify stubs); Spotipy credentials (CLIENT_ID/CLIENT_SECRET) are required for real Spotify integration.

If asked to bootstrap or add CI

- Propose adding a `requirements.txt` and a simple GitHub Actions workflow `.github/workflows/ci.yml` that: sets up Python, installs dependencies, runs a smoke test (e.g., `python -m pip install -r requirements.txt && python -c "import app"`).
- Add `.gitignore` entries: `/exports`, `/reports`, `/Users/*/suno_downloader/suno_session.txt`, `.venv`.

Conventions & PR guidance

- Keep PRs small and focused, follow existing commit-style suggestions (e.g., `feat:`, `fix:`).
- Document any new external credentials needed (Spotify keys, etc.) and prefer env vars over committed secrets.

Developer notes & gotchas (precise)

- Many file paths are hard-coded absolute macOS paths—update `SESSION_ID_PATH`, `BASE_DIR`, and `EXPORTS_DIR` before deployment or run in a dev wrapper that sets them.
- `pydub` requires `ffmpeg` available on PATH; missing ffmpeg will cause WAV generation to fail.
- The Suno client library usage assumes `client.songs.list(...)` returns an iterable; there is no built-in pagination helper aside from `page` and `limit` loops in `master_sync.py`.

Examples from this repo (where to look)

- API endpoints: `app.py` (search for `/api/` routes) 🔧
- Frontend expectations: `script.js` (uses `API_URL`) ⚡
- Auto session sync: `suno_sovereign_link.user.js` (Tampermonkey) 🧭
- Sync/export: `master_sync.py` (writes `reports/Master_Suno_List.xlsx`) 📊

When you have questions for maintainers

- Which Python version should we target? (e.g., 3.10+)
- Do you want a `requirements.txt` and a GH Actions CI that runs smoke checks on PRs?
- Where should exported WAVs and reports be persisted in production (S3, shared drive, or repo-specific folder)?

Contact & escalation

- If maintainers don't respond in 3 business days, open an Issue proposing one minimal scaffold (requirements + CI) with a fallback option.

— End of instructions —

Please review and tell me any missing environment details (Python version, preferred CI, or paths) so I can refine these instructions.
