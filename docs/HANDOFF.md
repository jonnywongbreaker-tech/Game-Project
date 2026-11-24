# Session handoff (start a new chat from here)

**Repo:** `jonnywongbreaker-tech/Game-Project`, branch `claude/gifted-hopper-gfi4vc` (all work pushed).
**Read first:** `PROJECT.md` (single source of truth), then `docs/RENDERER_ASSESSMENT.md`, `docs/SHOT_GRAMMAR.md` and `docs/SCRIPT_FORMAT.md`.

## What this is
A code-driven 2D/2.5D animation engine (Remotion + React + TypeScript + SVG) for a YouTube channel. It supports faceless narration and character dialogue, and renders 16:9, 9:16 Shorts and thumbnails. The Flutter game that used to live in this repo was replaced; it's still in git history.

## How we got here (decisions)
1. **v1:** JSON script → video pipeline (ToonScript), QC, tests, benchmarks.
2. **Style prototypes:** three styles (A geometric, B textured, C cinematic). The owner chose **Cinematic Geometric Editorial** (A's construction + C's light and depth).
3. **v3:** a four-shot "How memory works" library benchmark using a custom 3D SVG renderer ("Space"). Approved as the direction, but **not** as the final quality standard.
4. **Latest round (awaiting owner review):**
   - Look system (banded light, cool-shadow/warm-light tints, stylized materials, less haze).
   - Person v2 character system and a procedural cast.
   - Four versatility scenes: urban, mechanical cutaway, natural, abstract.
   - Person v2 front and back views (chosen automatically from the camera angle) and a 10-expression set as data; review sheet `Character-Turnaround`.
   - Semantic shot grammar.
   - Three.js comparison spike. Recommendation: no rewrite; an optional hybrid environment layer, used only if a trigger fires.

## Owner's standing preferences
- Professional, competitive quality; art direction over effects ("don't just add bloom/particles").
- Everything reusable and engine-driven, never a one-off hand-made scene.
- JSON is an intermediate representation produced by an AI director, not written by hand.
- Present benchmarks for approval before major architecture changes; don't rewrite the renderer without approval.
- Keep PROJECT.md current; keep CLAUDE.md and AGENTS.md consistent; Codex reviews independently on its own branch.
- Target machine: Mac mini, 24 GB RAM. Quality over render speed for now.
- No reference PDF was ever received; the owner said to proceed without it.

## Open questions for the owner
- Do the four versatility scenes and Person v2 (including the new views and expressions in `Character-Turnaround`) meet the bar? What should change?
- Accept the hybrid renderer recommendation? (Measure the GPU first: `npx tsx scripts/spike-three.ts 60 angle` on the Mac mini.)

## Next steps (roadmap, see PROJECT.md §10)
1. **Character:** three-quarter front view, animated turns and expression blends, then review and lock Person v2.
2. **Shot grammar:** a named-subject registry per scene, camera collision and occlusion avoidance, composition rules.
3. **Renderer decision** after the Mac mini GPU measurement.
4. **Then:** voice pipeline (TTS + alignment + visemes), a diagram/chart library, the AI director (storyboard IR → shots and actions).

## Commands
`npm run studio` · `npm test` · `npm run check` · `npm run test:visual` (`-- --update` to approve a new look) · `npm run benchmark -- <Composition>` · `npm run render -- <id>`
Key compositions: `V-Urban`, `V-Machine`, `V-Nature`, `V-Abstract`, `Character-Sheet`, `Character-Turnaround`, `Memory-v3-CinematicGeometric`, `Spike-ThreeAtrium`.
Environment gotcha: render one Remotion process at a time in the cloud container (parallel renders can hang).
