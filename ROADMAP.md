# Sunopo Roadmap

## Goal

Move Sunopo from pre-alpha integration prototype to a reliable BlackMamba music control plane without a full rewrite.

## P0 — Stabilize the existing product

**Outcome:** current generation and catalog paths are predictable enough to build on.

- [ ] Fix missing Redis/session configuration imports in `app.py`
- [ ] Remove production-path mock catalog fallbacks
- [ ] Replace client-side `/control` authentication with server-side auth
- [ ] Define a normalized API error envelope
- [ ] Add request/correlation IDs
- [ ] Add backend health checks for Redis, provider connectivity, and storage
- [ ] Add smoke tests for `/health`, generation proxy, sessions, and song listing
- [ ] Align README/environment documentation with runtime behavior

**Exit criteria**

- clean startup with and without optional services
- failures return stable machine-readable errors
- secrets never need to be exposed to client JavaScript
- core smoke tests pass in CI

## P1 — Durable generation jobs

**Outcome:** generation becomes a real product workflow instead of a synchronous request plus simulated progress.

- [ ] Introduce `GenerationJob` model
- [ ] Persist normalized request, provider IDs, status, attempts, timestamps, and errors
- [ ] Add `POST /api/v1/generation-jobs`
- [ ] Add `GET /api/v1/generation-jobs/:id`
- [ ] Normalize returned clips into `Variant` records
- [ ] Replace fake UI progress with actual job state
- [ ] Add retry/cancel semantics where provider behavior permits
- [ ] Preserve prompt, tags, title, custom-mode settings, and provider metadata

**Exit criteria**

- browser refresh does not lose an active/completed generation
- a failed job can be diagnosed from stored state
- returned variants survive provider/UI refresh

## P2 — Canonical BlackMamba library

**Outcome:** Sunopo owns its catalog instead of treating a provider library as the database.

- [ ] Add durable `Track`, `Variant`, and `Asset` models
- [ ] Add provider/source ID mapping
- [ ] Add checksums for media assets
- [ ] Sync existing provider library into canonical records
- [ ] Track lyrics, artwork, audio, video, prompt, status, and timestamps
- [ ] Add search/filter/pagination over local catalog
- [ ] Add track workspace page
- [ ] Add duplicate/version detection

**Exit criteria**

- a track can be reopened without requesting its identity from the provider
- multiple provider versions can belong to one BlackMamba track
- catalog search is local and deterministic

## P3 — Preparation pipeline

**Outcome:** selected tracks can be turned into release-ready packages.

- [ ] Metadata completeness rules
- [ ] Lyrics editor/history
- [ ] Artwork asset management
- [ ] WAV/lossless export workflow
- [ ] audio technical checks
- [ ] description/tag generator as an explicit tool
- [ ] release checklist
- [ ] immutable asset-version history

**Exit criteria**

- one track has a clear `draft -> ready` preparation state
- missing release fields are visible before publication
- exports are reproducible and traceable to source assets

## P4 — Publishing control plane

**Outcome:** external publishing becomes safe, explicit, and auditable.

- [ ] Define destination adapter interface
- [ ] Implement prepare/validate step
- [ ] Implement explicit approval gate
- [ ] Persist `Release` and `DestinationPublication` state
- [ ] Add idempotency keys for external writes where possible
- [ ] Persist external IDs/URLs and execution evidence
- [ ] Add retry policy for transient failures
- [ ] Add first supported destination adapter

**Exit criteria**

- no external write occurs without an approved release
- retries do not silently create duplicates
- publication state can be reconstructed from local records

## P5 — Operations and scale

**Outcome:** high-volume use is observable and manageable.

- [ ] queue/worker model for long-running jobs
- [ ] structured logs and metrics
- [ ] audit event viewer
- [ ] storage lifecycle policy
- [ ] backup/restore runbook
- [ ] provider rate-limit controls
- [ ] bulk metadata/preparation actions
- [ ] library sync scheduler
- [ ] operational dashboard

## Product backlog after V1

- multiple generation-provider adapters
- local model adapter
- stems and remix lineage
- waveform/tempo/key analysis
- artwork generation pipeline
- release calendar
- analytics ingestion
- recommendation/selection assistant
- automated metadata suggestions
- mobile/remote control surface
- plugin/extension API

## Engineering rules

1. No rewrite unless a measured constraint requires it.
2. New provider code goes behind an adapter.
3. Product state belongs to BlackMamba persistence.
4. Long-running operations are jobs.
5. External writes are explicit and auditable.
6. Secrets remain server-side.
7. Every milestone must ship a usable vertical slice.
