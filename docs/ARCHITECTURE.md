# Sunopo Architecture

## Objective

Evolve the current Next.js + Flask prototype into a stable control plane without throwing away working integration code.

The main architectural change is to make provider-specific behavior live behind adapters while BlackMamba owns jobs, catalog identity, assets, release state, and audit history.

## Current system

```text
Browser
  |
  v
Next.js UI
  |
  +--> /display
  +--> /control
  |
  v
Next.js API proxy
  |
  v
Flask backend
  |
  +--> SunoClient
  +--> SessionStore / Redis
  +--> media export
  +--> catalog helpers
  +--> storage
```

This split is acceptable for the next stage. A rewrite is not required.

## Target boundaries

```text
                 +----------------------+
                 |      Next.js UI      |
                 +----------+-----------+
                            |
                            v
                 +----------------------+
                 |   Product API/BFF    |
                 +----------+-----------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| Generation    |   | Catalog       |   | Release       |
| Service       |   | Service       |   | Service       |
+-------+-------+   +-------+-------+   +-------+-------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| Provider      |   | DB + Assets   |   | Destination   |
| Adapters      |   |               |   | Adapters      |
+---------------+   +---------------+   +---------------+
        |
        +--> Suno adapter
        +--> future providers
```

## Provider adapter contract

Generation integrations should converge on a small internal interface rather than leaking provider SDK objects into product code.

Conceptually:

```python
class GenerationProvider:
    def create_job(self, request): ...
    def get_job(self, provider_job_id): ...
    def cancel_job(self, provider_job_id): ...
    def list_library(self, cursor=None): ...
    def fetch_asset(self, asset_ref): ...
```

The exact implementation may remain Python-first. The important constraint is that UI and catalog code consume normalized BlackMamba models.

## Product API contracts

Prefer versioned, resource-oriented contracts.

Suggested surface:

```text
POST   /api/v1/generation-jobs
GET    /api/v1/generation-jobs/:id
POST   /api/v1/generation-jobs/:id/cancel

GET    /api/v1/tracks
POST   /api/v1/tracks
GET    /api/v1/tracks/:id
PATCH  /api/v1/tracks/:id

GET    /api/v1/tracks/:id/variants
GET    /api/v1/tracks/:id/assets
POST   /api/v1/tracks/:id/exports

POST   /api/v1/releases
GET    /api/v1/releases/:id
POST   /api/v1/releases/:id/approve
POST   /api/v1/releases/:id/publish

GET    /api/v1/system/health
GET    /api/v1/audit-events
```

Existing endpoints can remain during migration and call the new services internally.

## Persistence

Redis is appropriate for transient session/job coordination, but the canonical catalog should use durable relational persistence.

Recommended first durable model:

- PostgreSQL for product state
- object storage or filesystem abstraction for media assets
- Redis for short-lived sessions, locks, queues, and cache

Do not use provider APIs as the primary database.

## Job model

Generation should stop using UI-simulated progress as the source of truth.

A job stores:

- internal ID
- provider
- provider job ID
- normalized request
- status
- attempts
- timestamps
- returned variant IDs
- structured error

The UI polls or subscribes to this product-owned state.

## Asset model

Store metadata separately from physical media.

An asset record should capture:

- asset ID
- track/variant owner
- kind (`audio`, `video`, `artwork`, `lyrics`, `waveform`, etc.)
- MIME type
- storage URI
- checksum
- byte size
- source
- created timestamp
- derivation parent when transformed

Checksums are important for duplicate detection and deterministic asset identity.

## Authentication and sessions

Production requirements:

- no client-side shared secret as authorization
- no provider credential exposed through `NEXT_PUBLIC_*`
- authenticated server session for control surfaces
- provider credentials stored server-side only
- HttpOnly cookies where browser sessions are used
- Secure cookies in HTTPS deployments
- CSRF protection for browser-authenticated writes
- explicit expiration/revocation

The existing Redis/Fernet work is a useful foundation, but it needs to be connected to a real application-auth model.

## External actions

Publishing adapters should implement a two-phase product flow:

1. **prepare/validate** — compute exactly what would be sent and return missing fields/warnings
2. **execute** — run only after approval and persist result/evidence

This makes automation safe and auditable.

## Error contract

Normalize errors at the product boundary.

Example:

```json
{
  "error": {
    "code": "GENERATION_PROVIDER_UNAVAILABLE",
    "message": "The generation provider could not be reached.",
    "retryable": true,
    "request_id": "req_..."
  }
}
```

Provider raw errors may be preserved in server logs but should not be exposed blindly to clients.

## Observability

Every request/job should have a correlation ID.

Minimum signals:

- structured application logs
- generation job duration/success/failure
- provider error rate
- session failures
- catalog sync counts
- export failures
- publication attempts/results
- audit events for privileged actions

## Migration strategy

1. keep current UI and Flask runtime working
2. fix current session/config defects
3. add canonical models and service layer behind current endpoints
4. migrate generation to durable jobs
5. migrate library responses to canonical catalog
6. add server-side auth for `/control`
7. introduce versioned `/api/v1` contracts
8. add publish adapters only after catalog identity is stable

The core rule: evolve by vertical slice, not by rewrite.
