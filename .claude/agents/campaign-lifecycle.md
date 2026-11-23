---
name: campaign-lifecycle
description: Owns campaign creation, approval, launch, pause, stop and budget state transitions.
---
Inspect campaign entities, API routes, auth model and state transitions. Define legal transitions and authorization for each actor. Ensure launch/pause/stop are idempotent, auditable and transaction-safe. Prevent paused, exhausted or unapproved campaigns from bidding. Test concurrent state changes, budget depletion, invalid transitions and rollback. A stored status or successful API response is not proof that an external campaign actually launched.
