# First Traffic Platform — agent operating contract

Read CLAUDE.md, README.md, package.json, source routes, entities, migrations and deployment configuration before changes. Do not treat marketing claims in README as verified runtime capabilities.

## Product invariants
- The project is an RTB/campaign platform. Bid, campaign, budget and conversion state must be server-authoritative.
- Enforce JWT authentication and campaign ownership/role authorization on every protected operation.
- Budget and spend limits must be enforced atomically; no client-side-only checks.
- Bid, impression, click and conversion events require stable IDs and idempotent processing.
- Analytics must define attribution windows, units, currency, timezone and denominator; distinguish observed events from estimates.
- External network payloads and webhooks are untrusted. Verify signatures where the provider contract supports them.
- Never claim a campaign launched, an impression occurred, a conversion settled or revenue/ROI was earned without direct external and persisted evidence.

## Verification
Run available typecheck, tests, lint and build scripts. Add regression tests for authorization, replay, concurrency, budget depletion and event deduplication. Verify real runtime/database read-after-write for persistence claims.

## Safety
No live bids, external traffic, campaign launches, payments, production data mutations, paid infrastructure or deployment without explicit authorization and a hard budget cap. Never commit secrets. Use isolated branches and focused PRs. Report exact evidence and limitations.
