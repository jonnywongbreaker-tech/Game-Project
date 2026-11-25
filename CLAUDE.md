# Instructions for Claude Code

PROJECT.md is the single source of truth (goal, architecture, decisions, QC, benchmarks, roadmap). Read it first and keep it current: any change to architecture, capabilities, limitations or benchmarks updates PROJECT.md in the same commit.

- Before committing: `npm run typecheck && npm test && npm run check` must pass.
- After changing anything visual: `npm run test:visual`. If the change is intended, approve it with `npm run test:visual -- --update` and look at the new goldens before committing.
- To inspect a frame: `npx remotion still <Composition> out/check/x.png --frame=<n>`. Render one at a time; parallel Remotion processes in this repo can hang.
- Separation rules (PROJECT.md §6): scene data and pure logic (`src/script`, `src/kit`, `src/qc`, `src/engine/{vocab,speech,designs,proportions,rig}`) never import React components; themes (`src/themes`) contain no timing or content.
- Space scenes: huge planes (floors, ceilings) need a large depth `bias` so the painter's sort keeps them behind; verify new geometry from several camera angles.
- Determinism: never use `Math.random()`; use Remotion's `random(seed)`.
- No per-frame SVG texture filters (feTurbulence/feDisplacementMap over large areas). Use baked textures (`npm run bake-textures`) or geometry jitter (`src/themes/draw.ts`).
- Adding vocabulary (poses, modules, actions): update `docs/SCRIPT_FORMAT.md` and add a test in the same change.
- Writing an episode: follow docs/SCRIPT_FORMAT.md. Change the camera or add a caption at least every ~10 s, and keep subtitle lines under ~90 characters.
- Project location and sync (PROJECT.md §11): the owner's Mac mini is the primary home and GitHub is the shared source of truth. Base work on the latest `engine` branch, push every finished change, and keep renders, caches and bundles under the ignored `out/` folder.
