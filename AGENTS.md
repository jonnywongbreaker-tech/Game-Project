# Instructions for other coding agents (e.g. Codex)

Read PROJECT.md first: it holds the architecture, design rules, benchmarks and roadmap.

- Claude Code is the primary developer. Work on your own branch and don't edit files another agent is changing.
- When reviewing: rank findings by impact and effort against the five benchmarks in PROJECT.md,
  cite `file:line`, and don't implement until approved.
- Verification: `npm install`, `npm run typecheck`, `npm run check`, then `npm run render -- Ep001 --thumb` for a quick visual.
