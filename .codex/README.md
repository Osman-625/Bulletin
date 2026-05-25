# Codex Project Pack

This folder is the Codex companion to `.claude/`.

Codex reliably loads the root `AGENTS.md`, so that file remains the always-on instruction source. This folder keeps the heavier operating material organized: rules, reviewer prompts, workflows, and local verification scripts.

## How To Use

1. Start with `AGENTS.md` at the repo root.
2. Before editing code, open the matching file in `.codex/rules/`.
3. For reviews, use the matching prompt in `.codex/agents/`.
4. For common tasks, follow `.codex/workflows/`.
5. Before handing work back, run `.codex/scripts/verify.ps1`.

## Map From `.claude/`

| Claude folder           | Codex equivalent       | Notes                                                                  |
| ----------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `.claude/settings.json` | `.codex/settings.json` | Project command and policy index for Codex sessions.                   |
| `.claude/rules/`        | `.codex/rules/`        | Path-scoped engineering rules rewritten for this repo.                 |
| `.claude/agents/`       | `.codex/agents/`       | Reviewer and specialist prompts usable by Codex.                       |
| `.claude/skills/`       | `.codex/workflows/`    | Practical procedures for implementation, review, debug, and ship work. |
| `.claude/hooks/`        | `.codex/scripts/`      | Codex does not run Claude hooks, so scripts are explicit commands.     |

## Important Limits

- Do not put secrets, local credentials, or private keys in this folder.
- Do not treat `.codex/settings.json` as an automatic permission system. It is a local project index.
- Do not bypass `AGENTS.md`; it has the highest-value instructions for Codex in this repo.
