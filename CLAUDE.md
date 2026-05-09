## Commands

```bash
npm run dev          # dev server
npm run build        # production build
npm test             # vitest unit suite
npm run test:e2e     # playwright E2E
npm run lint         # eslint
npm run format       # prettier --write .
npx tsc --noEmit     # type check
```

@AGENTS.md

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
