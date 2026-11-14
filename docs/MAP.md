# First Traffic Platform — Project Map

Last reviewed: 2026-11-14. This is an initial navigation map seeded from the repository README; source-code and production verification remain required before treating its architecture statements as current.

## Product scope
A traffic-arbitrage / campaign management platform. The README describes campaign lifecycle, RTB bid/impression/click/conversion endpoints, and analytics.

## Declared stack (README; verify against current source)
- Node.js 18+, TypeScript, Express.js
- PostgreSQL 13+, TypeORM
- JWT authentication
- Docker / Docker Compose
- Main code areas described in README: `src/controllers`, `src/services`, `src/entities`, `src/routes`, `src/middleware`, `src/app.ts`

## Required verification before implementation
1. Inspect current branch, package manifests, source tree, tests and deployment configuration.
2. Verify authentication, authorization, campaign state transitions, RTB idempotency and event integrity from code and tests.
3. Establish actual production hosting/database state; README alone is not deployment evidence.
4. Define acceptance tests before modifying billing, bidding, campaign execution or user data.

## AI agent operating contract
- Use isolated branches and draft PRs; never merge or deploy solely because CI is green.
- Inspect actual files and current runtime evidence before editing.
- No paid infrastructure, external spend, or production database changes without explicit authorization.
- Keep secrets out of source, logs, issues and project maps.


## AI engineering toolchain — required project standard

This section is shared across the active project maps. It records installation and runtime requirements; a repository entry is **not** proof that a tool is installed or active.

### 1. Caveman — concise agent output

- Upstream: https://github.com/JuliusBrussee/caveman
- Claude Code: `claude plugin marketplace add JuliusBrussee/caveman && claude plugin install caveman@caveman`
- Codex CLI: `npx -y github:JuliusBrussee/caveman -- --only codex` (or install its skill with `npx skills add JuliusBrussee/caveman -a codex -g`).
- Use the project/user scope matching the actual coding-agent host. Restart/reload the host and verify the skill is discoverable before counting it as installed.
- Do not apply compression to source code, identifiers, error messages, test assertions, API contracts, security rules, or acceptance criteria. Preserve negations and exact technical facts.

### 2. codebase-memory-mcp — persistent code graph

- Upstream: https://github.com/DeusData/codebase-memory-mcp
- Supported host install (macOS/Linux): `curl -fsSL https://raw.githubusercontent.com/DeusData/codebase-memory-mcp/main/install.sh | bash`
- The installer detects supported coding-agent clients and registers MCP/instructions where available. Restart the coding agent, verify the MCP server is visible, then explicitly index this repository.
- Keep the graph/index on a persistent developer or agent host. A disposable GitHub Actions runner or ephemeral Railway cron container is not a persistent memory installation.
- Before production rollout, pin and verify the release/checksum; do not silently install unpinned `main` into a production runtime.

### 3. Spotify Portal AI Plugins — AiKA delegation

- Upstream: https://github.com/spotify/portal-ai-plugins
- Claude Code:
  `claude plugin marketplace add spotify/portal-ai-plugins`
  `claude plugin install portal@portal`
  `claude plugin install shunt@portal`
- Codex: `codex plugin marketplace add spotify/portal-ai-plugins`, then install Spotify Portal from `/plugins`. Cursor is installed through its team marketplace.
- Start a new supported agent session and run `/portal:setup`; authenticate the Portal CLI. Run its read-only doctor/readiness checks.
- The shunt plugin is Claude Code-only. It requires Portal CLI authentication and AiKA availability; verify `bulk-reader` and `code-writer` modes before relying on delegation. Do not create modes or change Portal settings without explicit authorization.
- Never put Portal credentials or local MCP configuration in this repository.

### 4. Runtime compatibility and installation evidence

- These are coding-agent integrations, not generic Python/Node runtime packages. A worker that only sends HTTP requests to the Starimg API cannot load Claude/Codex plugins or call a local MCP server unless it is explicitly given that agent runtime and MCP client.
- GitHub Actions runners are ephemeral: use them for bounded jobs, CI checks and a temporary fallback agent, not as the persistent host for a local code graph or authenticated Spotify Portal session.
- The Railway `stream-service` worker is a Python/Starimg HTTP worker; its current code path does not expose a Claude Code/Codex plugin host or MCP client. Do not claim these integrations are installed there.
- Record each tool independently as `not installed`, `installed`, `connected`, `indexed`, and `verified`. Only advance a state after observing its exact runtime check. Never store tokens or secret values in this map.
- Current blocker: the last Starimg Fable task request returned HTTP 402 before model execution. Do not retry billable generation until the provider returns a successful, authenticated test request.

### 5. GitHub Actions fallback

- When the Railway worker is unavailable, use a repository-owned GitHub Actions agent workflow only if that workflow exists, its trigger/permissions are verified, and the model/provider can be invoked successfully.
- For Sherlock Scholes, `.github/workflows/local-autonomous-agent.yml` listens for an owner-authored issue comment beginning with `/ai ` and runs the local Qwen2.5-Coder 3B model on a GitHub-hosted runner. It is a separate fallback from Starimg/Fable, has a restricted patch allowlist, and must produce a draft PR with CI evidence. It is not Fable 5.2.
- Do not assume another repository has this fallback: inspect its workflow and trigger before requesting work there.
- No automatic merge or production deployment. Review the exact PR head, run required checks, and verify deployment separately.

### Installation status (2026-11-14)

| Integration | Repository documentation | Active runtime installation |
|---|---|---|
| Caveman | Project skill at `.agents/skills/caveman/SKILL.md` | Included in this PR; runtime discovery/activation not yet verified |
| codebase-memory-mcp | Recorded here | Not verified; no persistent supported host indexed |
| Spotify Portal / shunt | Recorded here | Not verified; Portal authentication and AiKA readiness not established |

