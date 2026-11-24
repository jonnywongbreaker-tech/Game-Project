# Toon Engine: project guide

**This file is the single source of truth.** `CLAUDE.md` (Claude Code) and `AGENTS.md`
(Codex and other agents) only add working rules and point here.

## 1. Goal

A professional, scalable 2D animation production engine for YouTube: a narration
script in, a finished long-form video, Short and thumbnail out. Minimal manual work
per video, near-zero generation cost, and visual quality that competes with
established educational and entertainment channels. Niche-independent: swapping the
theme and asset kits retargets the engine.

## 2. Status (current)

| Area | State |
| --- | --- |
| Script → video (JSON) | Working: dialogue + narrated modes, 16:9 + 9:16 + thumbnail from one scene, voice-over timing |
| Visual direction | **Awaiting decision**: three prototypes A / B / C (section 3) |
| Rig | Puppet rig v2: full skeleton, IK arms and legs, planted feet, look-at, lean/anticipation, secondary motion |
| Props | Parenting to world / one hand / two-hand carry with smooth hand-offs |
| Environments | Modular, data-placed kit (library set) with procedural shelves; parallax depth layers |
| Concept visuals | Network kit (grow, pulse, spread, fade, dissolve). Charts/diagrams library not built yet |
| QC | Static QC (composition, readability, sync, movement, repetition, pacing), unit tests, visual regression, determinism, benchmarks |
| Automation | Director / storyboard stage designed (section 5), not built |

## 3. Visual direction: the three prototypes

All three render **the same scene file** (`src/prototypes/memory/scene.ts`): the same
layout, choreography, camera, narration and concept. Each theme
(`src/themes/*.tsx`) only decides how things look. The concept is
**how memory works**: memories are orbs filed on shelves, new memories link to
existing ones, recall spreads along links, and an unlinked memory fades away.

Each 15 s prototype shows:
- **Environment:** a library interior with background windows, mid-ground shelves and lamps, the stage, and a foreground column and book stack, all at parallax depths.
- **Body mechanics:** a constant-pace walk with planted feet, then anticipation (lean back, dip), a reach onto the toes, placement, a backwards step, a point, and a cheer with knee dip.
- **Object interaction:** carry with two hands → hand-off to one hand → IK reach → place in a shelf slot.
- **Camera:** trucking parallax → push-in → medium shot on the concept → pull-out.
- **Concept visual:** links grow, a recall pulse propagates along them, and the isolated memory fades and dissolves.

| | A · Geometric editorial | B · Textured editorial | C · Cinematic 2.5D |
| --- | --- | --- | --- |
| Look | Flat planes, strict midnight + amber palette, Swiss type | Riso print + hand ink: off-register fills, halftone, hatching, paper grain, serif type | Painterly light: warm lamps vs cool moonbeams, glows, gradients, depth of field, grade |
| Light | Graphic (flat light shafts, concentric halos) | Implied (sunbeams, halftone density) | Motivated (each orb lights its surroundings, cast and contact shadows, rim light, bloom) |
| Line | None (shape-based) | Wobbly ink that "boils" on threes (geometry jitter, no SVG filters) | None (form via value) |
| Character | Two-tone planar shading | Ink outline + halftone shadow, freckles, scarf with secondary motion | Cylinder-shaded limbs, gradient skin, detailed eyes, rim light |
| Strength | Crisp, scalable, cheapest to automate and to extend | Most distinctive, warm, "handmade" | Most premium and atmospheric |
| Risk | Can feel generic without strong art direction | Busy at small sizes; ink boil costs CPU | Highest render cost; flat characters can look out of place in rich light |

**Recommendation:** lock **C's lighting and depth stack on top of A's shape language**
("A+C"): geometric characters and props, rendered with motivated light, glow, depth of
field and grade. It keeps A's scalability (simple shapes are easy to generate and
extend) and gets most of C's premium feel. B is a strong alternative brand if you
want a handmade identity. The theme architecture supports any choice, and the
decision gates the asset-library work (roadmap phase 1).

### Reusability report

**Reusable now (engine level, style-independent):**
- **Puppet rig v2** (`src/kit/puppet.ts`): skeleton, two-bone IK for arms and legs, planted feet, lean, crouch, look-at, breathing, velocity-driven secondary motion. Any skin draws from its joints.
- **Props** (`src/kit/props.ts`): world, one-hand and two-hand parenting with smooth hand-offs.
- **Environment kit** (`src/kit/library.ts`): module types placed by data at any parallax depth. Procedural shelves fill themselves deterministically from a seed and leave reserved slots free for interactive objects.
- **Concept kit** (`src/kit/network.ts`): node/edge graph with growth, hop-by-hop activation, link pulses and fade/dissolve. It applies to ideas, neurons, social networks, supply chains and so on.
- **Camera** with depth layers and parallax (`src/engine/Camera.tsx`); per-depth blur and haze hooks.
- **Theme contract** (`src/themes/types.ts`) and the generic scene renderer (`MemoryScene.tsx`): any scene + any theme.
- Shared drawing helpers (`src/themes/draw.ts`), including filter-free hand-drawn wobble, and baked textures (`npm run bake-textures`).

**Prototype-specific (must be generalised before production):**
- **The choreography is hand-keyed code** (`scene.ts`: `heroAt`, `orbsAt`). The building blocks are reusable, but this particular sequence of actions is not data yet. Next step: express actions ("walkTo", "carry", "reachTo slot", "place", "point at", "look at") as script beats compiled to these kits (roadmap 1.3).
- **Character art lives inside each theme.** Each theme has one outfit and one hairstyle per style. Interchangeable garments, hairstyles and accessories need a part system with slots (roadmap 1.2).
- **Only one environment set (library).** More sets are needed per niche; each is a set of module types × themes.
- **Text styles** (subtitles, titles) are per theme but not yet selectable per episode in the JSON format.

**Needed to hit reference quality consistently:**
1. **Character design pass per locked style.** Proportions, faces, hands (mitten → 3–4 finger shapes) and a turnaround (front / ¾ / profile views). The rig supports view switching; the skins don't draw it yet.
2. **Animation layering.** Ease presets per action, overlapping action on more parts (coat tails, sleeves), and automatic anticipation and follow-through for every action, not hand-keyed.
3. **Lighting model as data.** Lights in the scene description, so themes shade characters and props consistently from them (today C hard-codes its rim-light side).
4. **Asset breadth.** 3–5 environment sets, 30–50 props, 3–4 characters with outfits, and diagram types (bar, line, flow, timeline, labelled cutaway).
5. **Art direction rules in QC.** Contrast/readability of text over backgrounds, silhouette clarity (character vs background value), and a minimum light/dark separation per theme.

## 4. Architecture review: capability matrix

| Capability | Status | Notes / required change |
| --- | --- | --- |
| Procedural characters, interchangeable parts/clothing/accessories | **Partial** | Data-driven presets (default style); rig/skin separation done. **Needs**: part registry with slots (hair, top, bottom, shoes, accessories) per theme: *architectural, medium* |
| Skeletal rigging, IK, animation blending | **Done (v2), extend** | Skeleton, 2-bone IK arms/legs, planted feet, pose blending, look-at, secondary motion. **Next**: layered clips (locomotion + gesture + additive), view turnarounds: *medium* |
| Modular environments, reusable scene components | **Done (kit), extend** | Data-placed modules at depths; procedural fill. **Next**: more sets; module props as JSON: *additive* |
| Object interaction, attachment, parenting, layering | **Done (basic)** | World/hand/two-hand parenting, hand-offs, depth layering. **Next**: named attachment points on props and environment slots, z-order rules: *small* |
| Themes independent of animation | **Done** | Proven by A/B/C on one scene. The default (Ep001) style should be ported to the theme contract: *medium* |
| Data-driven diagrams, charts, cutaways | **Partial** | Network kit only. **Needs**: chart/diagram components as script elements: *additive, high value* |
| Cinematic camera, parallax | **Done (basic)** | Keyframed camera, depth layers, speaker lead. **Next**: named shots (wide/medium/close), dolly zoom, rack focus, auto shot selection: *additive* |
| Lighting, shadows, textures, effects | **Prototype** | All three styles demonstrate it; it lives in themes. **Needs**: light rig as scene data: *architectural, medium* |
| Independent horizontal/vertical composition | **Partial** | One scene, format-aware camera (follows speaker in 9:16), QC checks both. **Needs**: per-format overrides (camera, caption placement, safe areas): *small* |
| Frame-accurate audio sync, phoneme lip sync | **Partial** | Per-line audio drives timing; word timing is estimated; mouth is generic flaps. **Needs**: forced alignment (word + phoneme times) → visemes: *medium* |
| Optional subtitle styles | **Partial** | Per theme + on/off per format. **Needs**: style selection in the script: *small* |
| Deterministic, reproducible rendering | **Done** | Seeded randomness only, pure functions of time, deterministic compile (tested), pixel-identical re-renders (tested), pinned dependencies, bundled fonts, baked textures |

## 5. Target architecture (automation)

JSON is the **intermediate representation**, produced by machines; humans review it
but don't have to write it.

```
narration text ─┐
                ▼
 1. VOICE        TTS or recorded VO → forced alignment → word + phoneme timestamps
                ▼
 2. DIRECTOR     (LLM, e.g. Claude) narration + channel style guide → STORYBOARD IR
                 shots: intent, visual metaphor, set, props, characters, emotion, on-screen text
                 the ONLY non-deterministic stage; output is cached and versioned
                ▼
 3. SCENE COMPILER  (deterministic code) storyboard + alignment + asset kits → SCENE IR
                 blocking/layout, action → rig/prop timelines, shot selection rules,
                 format variants (16:9, 9:16), timing locked to the audio
                ▼
 4. ANIMATION ENGINE  (Remotion renderer) scene IR + THEME → frames → MP4/PNG/SRT
                ▼
 5. QC           static IR checks + rendered-frame checks → issues
                 auto-fix loop: layout/timing issues → stage 3; creative issues → stage 2
```

Current code maps onto this as follows:
- Stage 3 exists in its first form (`src/script/compile.ts`: ToonScript → timelines).
- Stage 4 is `ScriptEpisode.tsx` / `MemoryScene.tsx` + themes.
- Stage 5 is `src/qc` + visual tests.
- Stages 1–2 are to be built.

**Storyboard IR (planned):** `{shots: [{id, narrationSpan, intent, metaphor, set, cast[],
props[], actions[], camera: 'wide'|'medium'|'close'|..., onScreenText?, diagram?}]}`.

## 6. Architectural decisions (ADR log)

1. **Remotion + React + SVG** for rendering: deterministic, frame-accurate, code-reviewable, no GPU required. Canvas/WebGL deliberately avoided until a measured need.
2. **Seconds, not frames**, in every authoring API.
3. **Content / logic / look separation:** scene data and pure logic (compile, rig, kits, QC) never import React components; themes never contain timing.
4. **One scene serves all formats.** Formats differ by camera, never by duplicated scenes.
5. **Determinism is a feature:** no `Math.random`; seeds everywhere; tested pixel-identical renders.
6. **No per-frame SVG filters for texture.** Measured: a scene-wide displacement filter costs ~10× real time. Use baked textures and geometry jitter. Blur filters are acceptable where they matter (C), but they are the main render cost.
7. **The camera leads the action:** speaker and scripted camera moves start 0.5 s before the line (found by QC).

## 7. Quality control and tests

| Command | What it covers |
| --- | --- |
| `npm run typecheck` | TypeScript |
| `npm test` | 28 unit tests: compiler validation and timing, determinism, QC detectors, speech timing, rig/IK, planted feet, prop hand-offs, network propagation, procedural assets, the prototype's carry/place logic |
| `npm run check` | Compiles every script and runs QC: overlap, off-screen/cropped speakers (both formats), fast speech, long Shorts subtitles, short captions, line overlap, sliding walks, pose flicker, repeated gestures, repeated backdrops, pacing metrics |
| `npm run test:visual` | Renders 12 key frames and compares them with approved goldens (per platform), plus a determinism re-render. `-- --update` approves a new look |
| `npm run benchmark` | Render speed, real-time factor, projected 10-minute render time, peak memory of the whole render process tree, versatility counts, authoring effort |

**Not yet covered:** checks on rendered pixels (text contrast, clipping detected from
the DOM, safe areas), audio drift against real VO files, unnatural joint angles.

## 8. Benchmarks

Latest numbers are in `benchmarks/LATEST.md`; history is in `benchmarks/results.json`.
All runs so far are on a 4-core cloud Xeon (not the target Mac mini). **Run
`npm run benchmark` on the Mac mini to establish the real baseline**: Apple Silicon is
typically several times faster per core, but that is an estimate until measured.

| Benchmark | Current measure |
| --- | --- |
| Visual quality | Prototypes A/B/C; protected by visual regression; judged by eye (no automatic score) |
| Versatility | 5 cast presets, 8 poses × 7 expressions, 4 default backdrops + 1 modular set (11 module types), 3 themes |
| Automation | Write JSON → `npm run check` → `npm run render`. Director stage not built, so the script is still written by hand (or by Claude in a session) |
| Performance | See the table below |
| Reusability | New JSON episodes need zero code. New *visual* actions still need code (roadmap 1.3) |

BENCHMARK_TABLE

## 9. Known limitations

- **Choreography of rich scenes is hand-keyed** (prototype `scene.ts`); the JSON format only exposes walk/pose/expression/emote/camera.
- **Default style (Ep001/Ep002) predates the theme contract** and uses the older rig. Port it once the visual direction is locked.
- **Lip sync** is generic mouth flapping; word timing is estimated unless real audio is synced per line.
- **Characters have one view** (¾); no turnarounds, hands are simple circles.
- **No rendered-pixel QC yet:** text contrast and real clipping are not machine-checked.
- **Render cost of style C/B** is high (blur filters; per-frame ink jitter). Optimisation is deliberately deferred until the look is locked.
- Visual goldens are platform-specific; regenerate on each machine (`npm run test:visual -- --update`).

## 10. Revised roadmap

Ranked by visual impact × scalability ÷ effort, respecting dependencies.

| # | Item | Impact | Scalability | Effort | Depends on |
| --- | --- | --- | --- | --- | --- |
| 0 | **Lock visual direction** (A / B / C / A+C) | ★★★ | ★★★ | S | You |
| 1.1 | Light rig as scene data, consumed by the locked theme | ★★★ | ★★ | M | 0 |
| 1.2 | Character part system (slots, outfits, hair, accessories) + design pass + turnarounds | ★★★ | ★★★ | L | 0 |
| 1.3 | Action vocabulary in the JSON: walkTo / carry / reach / place / give / point-at / look-at, compiled to puppet + props | ★★★ | ★★★ | M | — |
| 1.4 | Port default episodes to the theme contract + puppet v2 | ★★ | ★★★ | M | 0 |
| 2.1 | Voice pipeline: TTS + forced alignment → word timing + visemes | ★★★ | ★★★ | M | — |
| 2.2 | Diagram/chart library as script elements | ★★★ | ★★★ | M | 0 |
| 2.3 | Storyboard IR + Director (LLM) + shot-selection rules | ★★★ | ★★★ | L | 1.3, 2.2 |
| 2.4 | SRT export + YouTube metadata | ★ | ★★ | S | — |
| 3.1 | Rendered-frame QC (contrast, DOM-based collisions, safe areas) | ★★ | ★★★ | M | — |
| 3.2 | Environment sets + prop library for the chosen niche | ★★★ | ★★ | L (ongoing) | 0, 1.1 |
| 3.3 | Performance pass for the locked style (cache static layers, cheaper glows) | ★ | ★★★ | M | 0 |
| 4 | Retention-driven pacing feedback | ★★ | ★★ | M | published videos |

## 11. Working with multiple agents

- Claude Code is the primary developer; Codex reviews and optimises.
- Each agent works on **its own git branch**; never edit the same files at the same time.
- Reviews rank findings by impact and effort against the benchmarks (section 8) and cite `file:line`.
- Before any commit: `npm run typecheck && npm test && npm run check`. After visual changes: `npm run test:visual`.
