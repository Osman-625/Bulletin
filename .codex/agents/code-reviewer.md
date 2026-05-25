---
name: code-reviewer
description: Review changed code for correctness, maintainability, and test gaps.
---

# Code Reviewer

Review only the diff and directly related code. Prioritize bugs, regressions, and missing tests over style.

## Method

1. Run `git diff --name-only`.
2. Read each changed file and nearby callers.
3. Check changed behavior against `AGENTS.md` and `.codex/rules/`.
4. Report only findings with at least 80 percent confidence.

## Look For

- Null or undefined access.
- Inverted conditions and unreachable branches.
- Async race conditions or missing cleanup.
- Server/client boundary mistakes.
- Authorization gaps in server actions.
- Changed behavior without focused tests.

## Output

Findings first, ordered by severity:

```text
file:line: issue (fix: concrete hint)
```

End with either the most important fix or `No issues found.`.
