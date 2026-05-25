# Review Workflow

Use this before asking the user to accept substantial work.

1. Run `git diff --stat`.
2. Read each changed file.
3. Use the relevant prompts in `.codex/agents/`.
4. Check that changes obey `AGENTS.md`.
5. Verify tests match the risk of the change.
6. Report findings first. If none, say that clearly and list residual risk.
