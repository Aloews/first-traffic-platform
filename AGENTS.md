# Agent operating instructions

Before changing this repository, read the portable [Reality-First Autonomous Engineering skill](.agents/skills/reality-first-autonomous-engineering/SKILL.md) and its security/cost reference.

Use this repository's actual implementation, CI, deployment configuration, and documented business constraints as the source of truth. The skill defines the execution process; it does not grant permissions, override project-specific safety rules, or authorize paid resources, production data changes, destructive operations, or releases.

For every substantial task, define observable acceptance criteria, inspect the baseline, work on an isolated branch, run and inspect relevant checks, verify CI on the exact commit, and report only evidence-backed outcomes. Preserve existing behavior and data. Keep project-specific secrets, infrastructure, and state isolated from every other repository.

Do not send routine progress narration. Escalate only a material decision, genuine blocker, security/cost risk, or final evidence-based handoff.
