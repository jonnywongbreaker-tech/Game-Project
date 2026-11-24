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
| Visual direction | **Chosen: Cinematic Geometric Editorial** (A's construction + C's light and depth). Benchmark v3 awaiting approval (section 3.1). Character design NOT locked |
| Rig | Puppet rig v2: full skeleton, IK arms and legs, planted feet, look-at, lean/anticipation, secondary motion |
| Props | Parenting to world / one hand / two-hand carry with smooth hand-offs |
| Environments | **Space kit**: real 3D perspective with flat-shaded geometry, procedural architecture (atrium generator), lighting model, height fog. Plus the 2D parallax kit from v2 |
| Concept visuals | Network kit in 2D and 3D (grow, recall wave, persistent glow, fade, dissolve), particle bursts. Charts/diagrams library not built yet |
| Cinematography | Shot sequencer (cuts, per-shot camera keys, focus, depth-of-field bands, handheld drift) |
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

## 3.1 Benchmark v3: Cinematic Geometric Editorial (awaiting approval)

Composition `Memory-v3-CinematicGeometric` (18 s, four shots), built with the new
**Space** pipeline. Files: content in `src/prototypes/memory3/scene.ts`; renderer in
`src/prototypes/memory3/Memory3.tsx`; look in `src/themes/cge/`.

| Shot | Intent | Engine capabilities exercised |
| --- | --- | --- |
| 01 The archive (0–4.6 s) | Tiny vermilion librarian crossing a pool of light in a vast atrium; serif title in the negative space | Procedural atrium (≈3,700 polygons), perspective, oculus spotlight, height fog, volumetric beam, dust motes, low-angle crane with dutch roll |
| 02 A new memory (4.6–9.2 s) | Close-up: the orb lifted into the light; its glow lights her face | Puppet IK carry/lift/offer, look-at, prop rendered between the arms, scene light applied to the character, rim light, shallow depth of field (shelf bokeh) |
| 03 Connections (9.2–13.8 s) | Match cut to the orb on the shelf, then a three-stage pullback revealing a web of links across the void as recall spreads | 3D network (78 memories, 102 links), hop-by-hop recall wave, links igniting, dramatic dolly + crane + FOV change |
| 04 Forgetting (13.8–18 s) | An isolated memory on a balcony edge dims, then dissolves into sparks while the lit network glows behind; closing title | Bokeh background via DOF bands, flicker/fade, particle burst, editorial end card |

**Art direction choices:**
- **Palette:** cool slate stone and pale haze against two warm accents, the vermilion coat and the amber memories, so the eye always finds the character and the idea.
- **Light:** selective, not dark. Bright oculus and upper haze; light pools on the floor; orbs as point lights.
- **Composition:** strong negative space for typography; extreme scale contrast (a 1.7 m figure in a 46 m atrium).
- **Typography:** a serif display face for statements, sans chapter marks, and subtitles at 44 px over a gradient scrim (no boxes), shown whole for readability.

**Character, "The Archivist" (exploratory, not locked):**
- **Silhouette:** tall figure (head about 1/7 of height), long A-line coat that swings with movement, funnel collar, trailing scarf, sharp asymmetric bob.
- **Face:** reduced to an eye, a nose wedge and a brow.
- **Colour:** multiplied by the scene's light at her position, so she sits inside the lighting.

### Reusable vs prototype-specific (v3)

**Reusable engine capabilities added:**
- `src/kit/space.ts`: camera, projection, near clipping, back-face culling, lighting model (hemisphere, directional, spot, point), height fog.
- `src/engine/Space.tsx`: renders polygons + sprites with depth sorting and depth-of-field bands.
- `src/kit/architecture.ts`: atrium generator (any sides, levels, bays, palette, seed) and a ladder. The same generator produces vaults, towers and archives.
- `src/kit/shots.ts`: shot sequencer with camera keys, focus, blur and handheld drift.
- `src/kit/particles.ts`: bursts and ambient motes.
- `src/themes/cge/Archivist.tsx`: a skin on puppet v2 with light-aware toning.
- `src/themes/cge/type.tsx`: editorial type system (Scrim, Subtitle, ChapterMark, Display).

**Prototype-specific:**
- The four camera paths and the archivist's action timings are hand-keyed data in `scene.ts`.
- The memory-network layout rules (two nearest neighbours + long links) are inline.
- Orb, link and beam drawing live in `Memory3.tsx` and should move into the theme.

**To reach the professional standard consistently:**
1. **Character design pass.** Hands and close-up anatomy (wrists, fingers as shapes), a three-quarter front view for faces toward camera, and an expression set. Close-ups are where the current design is weakest.
2. **Shot grammar as data.** Named shot types (establishing, close-up, insert, pullback, over-the-shoulder) generated from subject + intent, so the director stage can request "close-up on the orb" instead of keying coordinates.
3. **Character-in-3D rules.** Billboards cannot turn to face away from the camera; add front, back and profile views and pick per camera angle.
4. **Composition QC on rendered frames:** subject on thirds, text over negative space, contrast between figure and background.
5. **Geometry detail budget:** levels of detail (books merge into blocks with distance) to allow richer sets without slower renders.
6. **More architecture generators** (stairs, bridges, arches, domes, outdoor terrain) for other metaphors.

## 4. Architecture review: capability matrix

| Capability | Status | Notes / required change |
| --- | --- | --- |
| Procedural characters, interchangeable parts/clothing/accessories | **Partial** | Data-driven presets (default style); rig/skin separation done. **Needs**: part registry with slots (hair, top, bottom, shoes, accessories) per theme: *architectural, medium* |
| Skeletal rigging, IK, animation blending | **Done (v2), extend** | Skeleton, 2-bone IK arms/legs, planted feet, pose blending, look-at, secondary motion. **Next**: layered clips (locomotion + gesture + additive), view turnarounds: *medium* |
| Modular environments, reusable scene components | **Done (kit), extend** | Data-placed modules at depths; procedural fill. **Next**: more sets; module props as JSON: *additive* |
| Object interaction, attachment, parenting, layering | **Done (basic)** | World/hand/two-hand parenting, hand-offs, depth layering. **Next**: named attachment points on props and environment slots, z-order rules: *small* |
| Themes independent of animation | **Done** | Proven by A/B/C on one scene. The default (Ep001) style should be ported to the theme contract: *medium* |
| Data-driven diagrams, charts, cutaways | **Partial** | Network kit only. **Needs**: chart/diagram components as script elements: *additive, high value* |
| Cinematic camera, parallax | **Done (v3)** | 2D parallax camera plus 3D shot sequencer: true perspective, crane/dolly/pullback, FOV changes, depth of field, handheld drift. **Next**: named shot types and auto shot selection: *additive* |
| Lighting, shadows, textures, effects | **Done in Space (v3)** | Lights are scene data (hemisphere, directional, spot, point) shading all geometry and the character; fog, beams, particles. **Next**: cast shadows in 3D, port to the 2D kit: *medium* |
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
| `npm run test:visual` | Renders 14 key frames and compares them with approved goldens (per platform), plus a determinism re-render. `-- --update` approves a new look |
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

Measured 2026-11-24 on a 4-core cloud Xeon, 1920×1080, Remotion default concurrency:

| Composition | Render for 15 s | × real time | Projected 10-min video | Peak memory |
| --- | --- | --- | --- | --- |
| Default style (Ep001, 43 s) | 69 s | 1.6× | 16 min | 1.8 GB |
| A · Geometric | 35 s | 2.3× | 23 min | 2.2 GB |
| B · Textured | 105 s | 7.0× | 70 min | 2.7 GB |
| C · Cinematic | 207 s | 13.8× | 138 min | 3.6 GB |
| **v3 · Cinematic Geometric (18 s)** | 171 s | 9.5× | 95 min | 3.8 GB |

All four fit comfortably in 24 GB. C's cost is dominated by blur filters (depth of
field, bloom, soft shadows); B's by per-frame ink jitter on ~1,000 shapes. Both have
known optimisations (cache static layers as images, pre-blurred sprites, jitter
only on the stage layer) that are deferred until the look is locked.

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
| 0 | ~~Choose visual direction~~ → Cinematic Geometric Editorial. **Approve benchmark v3** (section 3.1) | ★★★ | ★★★ | S | You |
| 0.5 | Character design pass (close-up anatomy, views, expressions), then lock | ★★★ | ★★★ | M | 0 |
| 0.6 | Shot grammar as data (named shot types from subject + intent) | ★★★ | ★★★ | M | 0 |
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
