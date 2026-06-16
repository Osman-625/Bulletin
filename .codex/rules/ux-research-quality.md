---
alwaysApply: true
---

# UX Research Quality

Guardrails for auditing and fixing UI. Avoid the Seven Deadly Sins of UX Research. These apply to every audit, layout fix, and visual change.

## The Seven Deadly Sins (do not commit these)

1. **Credulity** — Do not assume the current UI, code comments, existing data assumptions, or prior fixes are correct. Verify behavior from the code and visible UI evidence before changing it.
2. **Dogmatism** — Do not force one layout pattern everywhere. Choose by the actual structure and intended UI: CSS Grid when grid is right, capped CSS columns when the design is masonry-style.
3. **Bias** — Do not chase only the bug that matches your first guess. Check layout, data flow, accessibility, performance, privacy, and UX separately. Confirm whether the cause is CSS, component structure, state logic, or a data mismatch.
4. **Obscurantism** — Do not write vague summaries like "improved responsiveness" or "fixed layout." Name the exact files, components, CSS rules, and state/data logic you changed.
5. **Laziness** — Do not patch symptoms. Never hide layout problems with `overflow-x: hidden` or arbitrary padding. Find the real cause of overflow, overlap, broken image rendering, or grid regression.
6. **Vagueness** — Do not report generic findings. Every bug report must include all five fields (see below).
7. **Hubris** — Do not rewrite a whole page because it feels cleaner. Preserve working data flow, current content, public/private filtering, search, filters, sorting, and the original column structure unless there is a proven reason to change them.

## Required bug report format

Every reported bug must include:

- **File / component** — the exact path and component.
- **Cause** — the real root cause (CSS rule, structure, state, or data).
- **Visible failure** — what the user actually sees go wrong.
- **Exact fix** — the specific change, not a description of intent.
- **Test step** — how to reproduce and confirm the fix.

## Working principles

- Verify before changing. Prefer evidence over assumptions.
- Keep fixes small and targeted. Explain tradeoffs.
- Preserve the intended 3-column board structure.
- Preserve current content and data behavior (public/private filtering, search, filters, sorting).
- Fix the real layout and image-format causes, not their symptoms.
