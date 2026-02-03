# Sunopo
programita

## Session flow (Suno)

This project uses the Suno session cookie to call the Suno API. New flow (recommended):

- Use the Tampermonkey script `suno_sovereign_link.user.js` on `suno.com` to POST the raw cookie string to `/api/session`.
- The server stores the cookie securely in Redis and returns a short-lived session token (also set as an HttpOnly cookie `SUNOPO_SESSION_TOKEN`).
- Scripts and tools can use the token via `X-Session-Token` header or `Authorization: Bearer <token>` for subsequent API calls to Sunopo.

Security notes:

- Set `SESSION_FERNET_KEY` in your environment (or in `.env`) to enable encryption of session values stored in Redis. Generate a key with:
  ```bash
  python tools/generate_fernet_key.py
  ```
- The following environment variables are relevant:
  - `REDIS_URL` (default: `redis://localhost:6379/0`)
  - `SESSION_TTL_SECONDS` (default: 86400)
  - `SESSION_FERNET_KEY` (Fernet key)

Tampermonkey example

- The supplied `suno_sovereign_link.user.js` will POST the cookie to `/api/session` and store the returned token in `localStorage` under `SUNOPO_SESSION_TOKEN`. It also includes `sendToSunopo()` helper that sends the token with `X-Session-Token` and `Authorization` headers for subsequent requests.

