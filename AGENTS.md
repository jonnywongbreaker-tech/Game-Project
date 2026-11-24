# Instructions for other coding agents (e.g. Codex)

PROJECT.md is the single source of truth: goal, status, capability matrix, architecture decisions, QC, benchmarks, known limitations and roadmap. Read it before anything else.

## Your role
Independent reviewer and optimiser. Claude Code is the primary developer.
- Work on your own branch; never edit files another agent is changing.
- When reviewing: rank findings by impact and effort against the five benchmarks in PROJECT.md §8, cite `file:line`, and challenge decisions in §6 where justified. Do not implement until approved.

## Setup and verification
```
npm install
npm run typecheck
npm test                 # unit tests
npm run check            # script validation + QC
npm run test:visual      # visual regression (goldens are per platform; on a new machine run with -- --update first)
npm run benchmark        # render speed / memory; results in benchmarks/LATEST.md
npm run studio           # interactive preview of every composition
```

## Where things are
- `src/script`: JSON script format, compiler, camera path (pure)
- `src/kit`: puppet rig v2, props, 2D environment kit, concept network, **space** (3D projection + lighting), **architecture** generators, **shots** sequencer, particles (pure)
- `src/themes`: visual themes A/B/C (v2 benchmark) and `cge/` (Cinematic Geometric Editorial: Archivist skin, type system)
- `src/prototypes/memory`: v2 style benchmark; `src/prototypes/memory3`: v3 four-shot benchmark (current)
- `src/engine/Space.tsx`: 3D renderer (polygons + sprites, depth sort, depth of field)
- `src/qc`: quality-control analyser; `tests/`: unit tests and visual goldens
- `scripts`: check, render, benchmark, visual-test, bake-textures, sync-audio
