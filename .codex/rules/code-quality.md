---
alwaysApply: true
---

# Code Quality

## Scope

- Keep edits tightly scoped to the user request.
- Do not refactor adjacent code unless the request cannot be completed safely without it.
- Prefer existing local helpers, components, and data access patterns.
- Avoid premature abstractions. Add helpers only when they remove real duplication or clarify a shared behavior.

## TypeScript

- Do not add `any`.
- Derive database shapes from `src/lib/database.types.ts`.
- Prefer narrow types at boundaries and let implementation details infer where clear.
- Keep server-only code out of client components.

## Naming

- Components and classes: `PascalCase`.
- Utilities and directories: `kebab-case`.
- Booleans: `is`, `has`, `should`, or `can` prefix.
- Event handlers: `handle*` internally and `on*` for props.
- Use `id`, `url`, `api`, `db`, and `auth` only as common abbreviations.

## Organization

- Imports: builtins, external, internal aliases, relative imports, type imports.
- Prefer named exports.
- Keep one major component or class per file.
- Put public APIs before helpers, then helpers in call order.

## Comments

- Comments explain why, not what.
- No dead code or commented-out blocks.
- Use `TODO(author): desc (#issue)` only for tracked work.
