# Unified engineering agents — First Traffic Platform

The `.claude/` agents supplement `AGENTS.md`, `CLAUDE.md` and the repository's actual source contracts.

## Roles
- `engineering-lead`: scope, task DAG, integration and evidence.
- `backend-engineer`: Express/TypeScript APIs and persistence.
- `rtb-engine`: bid eligibility, latency, idempotency and spend caps.
- `campaign-lifecycle`: campaign transitions and launch/pause authorization.
- `analytics-integrity`: event attribution, deduplication, CTR/CVR/CPA/ROI correctness.
- `provider-integration`: ad network and external API contracts.
- `data-integrity`: transactions, event identity and read-after-write.
- `security-reviewer`: JWT, authorization, spend controls and data privacy.
- `frontend-product-qa`: dashboard states and truthful analytics presentation.
- `qa-adversarial`: independent attempts to falsify platform claims.

Skills: `reality-first`, `release-gate`, `agent-handoff`.
Commands: `/verify`, `/finish-task`, `/security-gate`.
Dispatch: `/dispatch` (launches named specialist subagents when the Claude Code runtime exposes the Task tool; otherwise requires sequential work).

Run `python3 scripts/validate_agent_system.py`. The CI workflow validates local metadata only; it does not prove real RTB traffic, campaign activation, conversions or revenue.
