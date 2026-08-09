# Sunopo — BlackMamba Music Control Plane

Sunopo is the control plane for the BlackMamba music workflow: generate music, inspect the connected catalog, prepare assets, and progressively automate distribution from one interface.

The project started as a minimal Suno-inspired UI. The current codebase is already a hybrid product with a Next.js frontend, a Flask backend, session handling, a Suno client integration, catalog endpoints, audio export utilities, and early distribution automation experiments.

## Product direction

Sunopo is not intended to remain a visual clone of another product. The target is a provider-agnostic music operating layer where generation engines, catalog sources, analysis tools, metadata, artwork, publishing destinations, and automation can be connected behind a stable BlackMamba interface.

```text
Creator
  |
  v
BlackMamba UI
  |
  +--> Generate
  +--> Library
  +--> Analyze
  +--> Metadata
  +--> Artwork
  +--> Publish
  +--> Analytics
        |
        +--> Suno / future engines
        +--> Local tools
        +--> SoundCloud / future destinations
```

See [`docs/PRODUCT.md`](docs/PRODUCT.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and [`ROADMAP.md`](ROADMAP.md) for the product contract and delivery plan.

## Current capabilities

### Generation

- Public Spanish generation interface at `/display`
- Prompt-based generation
- Custom mode with lyrics, tags/style, and title
- Multiple returned clips
- Playback, download, artwork preview, and share controls
- Next.js API proxy at `POST /api/generate`
- Flask generation backend using `SunoClient`

### Library and media

The Flask backend includes catalog and media operations such as:

- `GET /api/songs`
- paginated library retrieval
- optional full-library iteration
- title, artwork, audio, video, prompt, lyrics, timestamps, and status data
- WAV export utilities
- track-analysis/description helpers

### Sessions and infrastructure

The repository contains infrastructure for:

- Redis-backed session storage
- optional Fernet encryption
- cookie/header/query session-token resolution
- local session fallback
- S3-ready storage configuration
- Docker/CI work from earlier iterations

### Administration

- `/control` provides an early administrative surface
- system status and product configuration concepts are already represented

**Important:** the current `/control` authentication is client-side and must not be treated as production security. Server-side authentication is a launch blocker.

## Architecture

The current runtime is split into two layers:

```text
Browser
  |
  v
Next.js 16 / React 19
  |
  | POST /api/generate
  v
Next.js route handler
  |
  | BACKEND_URL
  v
Flask :5555
  |
  +--> SessionStore / Redis
  +--> SunoClient
  +--> catalog endpoints
  +--> export / analysis tools
```

The immediate architectural goal is to preserve this split while introducing stable service boundaries so generation providers and publishing destinations can be swapped without rewriting the UI.

## Technology

### Web

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Backend

- Python
- Flask
- Redis
- cryptography / Fernet
- pydub
- boto3
- SunoAI client integration

## Local development

### Prerequisites

- Node.js 18+
- Python 3.10+
- Redis for server-side sessions
- ffmpeg if WAV/media conversion is used

### 1. Clone

```bash
git clone https://github.com/Blackmvmba88/Sunopo.git
cd Sunopo
```

### 2. Frontend

```bash
npm install
cp .env.example .env.local
npm run dev
```

The web app runs at `http://localhost:3000` by default.

### 3. Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

The Flask backend runs at `http://localhost:5555` by default.

### 4. Redis

Run Redis locally or set `REDIS_URL` to an accessible instance.

## Environment

Copy `.env.example` and configure only the values needed for your environment.

Core variables include:

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Next.js -> Flask backend URL |
| `REDIS_URL` | Redis connection for server-side sessions |
| `SESSION_TTL_SECONDS` | Session lifetime |
| `SESSION_FERNET_KEY` | Optional session encryption key |
| `SUNO_SESSION_ID_PATH` | Local fallback path for the Suno session value |
| `SUNOPO_EXPORTS_DIR` | Generated/exported media directory |
| `SUNOPO_REPORTS_DIR` | Reports directory |
| `SUNOPO_USE_S3` | Enable S3-backed storage where supported |
| `SUNOPO_S3_BUCKET` | S3 bucket name |
| `AWS_REGION` | AWS region |
| `NEXT_PUBLIC_CONTROL_SECRET` | Legacy client-side control secret; development only |

Do not commit real session cookies, secrets, tokens, or encryption keys.

## API surface

The repository currently exposes or contains handlers for:

- `POST /api/generate` — generate music
- `GET /api/songs` — retrieve catalog items
- `POST /api/session` — create a server-side session token
- `GET /api/session/validate` — validate session token
- `DELETE /api/session/<token>` — revoke session token
- `POST /api/update_session` — legacy/local session update path
- `POST /api/generate_wav/<song_id>` — WAV export
- `GET /api/download/<song_id>` — exported WAV download
- `POST /api/analyze_track/<song_id>` — generate track metadata/description helper
- `GET /health` — backend health check

This surface will be normalized and versioned before a public release.

## Product gates

Sunopo should not be considered production-ready until the following gates are complete:

1. server-side control authentication
2. session/security hardening
3. deterministic error contracts across Next.js and Flask
4. removal of demo/mock fallbacks from production paths
5. persistent catalog model independent of any single provider
6. generation job state instead of simulated progress
7. automated tests for generation, session, library, and export contracts
8. observability and structured audit logs
9. deployment configuration and secrets policy
10. explicit provider-compliance review before external release

## Delivery model

Product work is organized around four vertical slices:

1. **Generate** — reliable job-based generation
2. **Library** — canonical local catalog and sync
3. **Prepare** — lyrics, metadata, artwork, audio variants, QA
4. **Publish** — explicit, auditable delivery to external destinations

See [`ROADMAP.md`](ROADMAP.md) for milestones and acceptance criteria.

## Security posture

Treat all third-party session material as credentials.

- never expose provider session values to browser code
- prefer HttpOnly server-managed tokens
- avoid query-string credentials in production
- use encrypted storage for persisted sensitive values
- require explicit authorization for publishing or destructive operations
- keep generation and publishing actions auditable

## Status

**Stage:** pre-alpha productization.

The repository already proves the core integration path. The current focus is turning that prototype into a stable, provider-agnostic product with predictable contracts and safe operations.

## License

MIT.
