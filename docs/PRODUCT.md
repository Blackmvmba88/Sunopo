# Sunopo Product Contract

## Product thesis

Sunopo is the BlackMamba control plane for an end-to-end music workflow. It should let a creator move from an idea to a managed catalog item and eventually to an approved publication without depending on the UI or data model of any single generation provider.

The product is built around a simple rule:

> A generated clip is not the product. A managed, traceable music asset is the product.

## Primary user

The primary user is a high-volume creator who needs to generate, compare, organize, prepare, export, and publish many tracks while keeping metadata and source history intact.

## Core jobs

### 1. Generate

Create one or more candidate tracks from a prompt, lyrics, style controls, and generation settings.

Success means:

- the request is represented as a durable job
- returned variants are preserved
- failures are actionable
- the originating prompt/settings are retained

### 2. Library

Normalize generated tracks into a canonical BlackMamba catalog independent of the source provider.

A catalog item should eventually own:

- internal ID
- provider/source IDs
- title and version
- artist and credits
- lyrics
- prompt and generation settings
- audio/video/artwork assets
- timestamps and status
- publication state per destination
- audit history

### 3. Prepare

Turn a selected candidate into a release-ready asset.

Preparation can include:

- metadata cleanup
- lyrics
- artwork
- audio format variants
- loudness/technical checks
- descriptions and tags
- duplicate/version detection
- release checklist

### 4. Publish

Deliver an approved asset to supported external destinations.

Publishing must be:

- explicit
- destination-aware
- idempotent where possible
- observable
- auditable
- reversible when the destination supports reversal

No external write should be hidden behind a background side effect.

## Product surfaces

### Generate

The creative cockpit. Prompt, lyrics, style, title, provider, job state, variants, playback, and selection.

### Library

The canonical catalog. Search, filters, versions, assets, metadata completeness, provider source, and publication status.

### Track workspace

One durable page per catalog item containing source history, lyrics, assets, metadata, analysis, exports, and release status.

### Publish

A release queue with destination readiness, missing-field checks, preview, explicit approval, execution result, and evidence.

### Control

Operational state: provider connectivity, queues, errors, sessions, storage, jobs, and audit events. This surface requires server-side authentication before production use.

## Product principles

1. **BlackMamba owns the canonical model.** Providers are adapters, not the database schema.
2. **Jobs are durable.** Generation and publishing are represented as state machines, not fake progress bars.
3. **Assets are immutable by default.** New transformations create versions rather than silently overwriting originals.
4. **External actions are explicit.** Publishing and destructive operations require a clear user decision.
5. **Everything important is traceable.** Source, prompt, version, transformation, publication, and error history remain inspectable.
6. **Provider failures do not corrupt the catalog.** Local state remains coherent even when external systems fail.
7. **Automation prepares; approval executes.** High-confidence automation can fill and validate data, but external writes remain governed.

## Canonical entities

### Track

The creative identity of a song.

### Variant

A generated or edited version of a track.

### Asset

Audio, video, artwork, lyrics, stems, waveform, or other media attached to a track/variant.

### GenerationJob

A provider request and its lifecycle.

Suggested states:

`queued -> submitted -> processing -> complete | failed | cancelled`

### Release

A prepared publication package for one track/variant.

### DestinationPublication

The state of a release on one external platform.

Suggested states:

`draft -> ready -> approved -> publishing -> published | failed | withdrawn`

### AuditEvent

A durable record of a meaningful state transition or external action.

## MVP definition

Sunopo reaches MVP when one creator can reliably:

1. authenticate to the local product
2. connect a supported generation provider through server-managed credentials
3. create a generation job
4. receive and compare variants
5. save a selected variant to the canonical library
6. reopen that track later with all source metadata intact
7. export a stable audio asset
8. see clear failures and retry safely

Publishing integrations are valuable but not required for the first product MVP; the catalog and generation workflow must be solid first.

## V1 definition

V1 adds the preparation and release workflow:

- metadata completeness rules
- artwork/lyrics/audio asset management
- destination adapters
- publication queue
- explicit approval gate
- audit trail and release evidence
- operational dashboard

## Non-goals for the first release

- replacing a DAW
- training a foundation audio model
- pretending every provider has identical capabilities
- fully autonomous publishing without approval
- building analytics before catalog identity is reliable

## Launch gates

A production launch requires:

- server-side authentication
- secrets policy and secure session storage
- provider adapter contract
- persistent canonical catalog
- job persistence
- structured logs and audit events
- test coverage for core state transitions
- documented backup/recovery path
- deployment runbook
- terms/compliance review for each connected provider and destination
