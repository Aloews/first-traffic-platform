---
name: release-gate
description: Release acceptance gates for RTB safety, campaign authorization and analytics correctness.
---
1. Map requirements to observable acceptance and regression tests.
2. Inspect full diff, schema, migrations, auth and secrets.
3. Run typecheck, lint, unit/integration tests and build where configured.
4. Verify JWT auth, campaign ownership and role authorization.
5. Verify atomic budget enforcement, idempotent bids and campaign transitions.
6. Verify event deduplication, attribution and analytics calculations.
7. Test concurrent updates, replay, timeout and partial transaction failures.
8. Require exact-head CI and real runtime/database evidence for behavior claims.
9. Document rollback, budget limits and operational risks.
10. Do not execute live traffic, bids, payments or production mutations without explicit authorization and a hard cap.
Missing critical evidence means PARTIAL/BLOCKED.
