# Verify First Traffic Platform task

1. Read AGENTS.md, CLAUDE.md, README.md, package.json, routes and schema.
2. Record branch, exact HEAD and changed paths.
3. Run available typecheck, tests, lint and build; note scripts that are absent or placeholders.
4. Verify JWT and campaign authorization for affected endpoints.
5. Verify bid budget caps, idempotency and transaction safety.
6. Verify event deduplication and analytics units/attribution.
7. Exercise actual runtime and read persisted state back where relevant.
8. Do not run live spend or production traffic tests.
9. Report PASS only with exact-head evidence; otherwise PARTIAL/BLOCKED.
