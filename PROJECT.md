# Toon Engine: project guide

**This file is the single source of truth.** `CLAUDE.md` (Claude Code) and `AGENTS.md`
(Codex and other agents) only add working rules and point here.

## 1. Goal

A professional, scalable 2D animation production engine for YouTube: a narration
script in, a finished long-form video, Short and thumbnail out. Minimal manual work
per video, near-zero generation cost, and visual quality that competes with
established educational and entertainment channels. Niche-independent: swapping the
theme and asset kits retargets the engine.

## 1.1 Repeatable production pipeline

Use the production CLI for new narrated episodes. Claude Code and Codex author the
episode JSON and run the same commands. The production entry point uses Remotion
and the existing SVG scene kits. It accepts an episode from disk with no static
registration or network assets. The earlier ToonScript demos and Studio
compositions are still available under their existing commands.

### Director workflow and handoff

Run from the repository root with Node.js 20+, FFmpeg with ffprobe, and
Chrome/Chromium. Set `REMOTION_BROWSER_EXECUTABLE` to an installed browser for
offline renders. The example voice generator needs Python 3 and the Flite SLT
shared voice library on Linux. macOS uses the built-in `say` command.

```sh
npm ci
npm run --silent production -- capabilities
npm run production:voice -- examples/river/episode.json
npm run --silent production -- check examples/river/episode.json
npm run production -- preview examples/river/episode.json valley --frame 15
npm run production -- contact examples/river/episode.json
npm run production -- assemble examples/river/episode.json
npm run typecheck && npm test && npm run check
npm run test:visual
```

The registry enumerates the production commands, flags, templates, input
requirements, caption sidecar format, and utility commands. `preview` defaults
to a 480 × 270 PNG. Use `--width 1920` to request a full-resolution still.
`contact` renders a midpoint per shot and reuses one browser and bundle across
the session. Each page contains up to 24 thumbnails in four columns, and
`contact.json` maps shot IDs to one-based row and column numbers.

Use `examples/river/episode.json` as a standalone starting point for a new
episode. It produces *Why Rivers Bend* using only card, nature, and flow
templates. To reproduce the thermostat pilot instead, run `npm run pilot:voice`
and pass `examples/pilot/episode.json` to the same production commands. Assembly
writes an MP4, SRT, and JSON manifest under `out/production/<episode-id>/` by
default. Use separate output directories for concurrent exports.

### Episode format and execution

The top-level object has `id`, `title`, and ordered `shots`. Each shot needs an
`id` unique within the episode and a `template`. The available templates are
`card`, `flow`, `urban`, `machine`, `nature`, and `abstract`. A `headline`
is required for `card` and `flow` and optional for the existing cinematic scenes.
A `flow` also takes two to four `labels`. Cinematic templates reuse the existing
scene and camera motions retimed to fill the shot. JSON configures the template
and headline. Cameras, rigs, and scene contents are still authored in code.

```json
{
  "id": "feedback",
  "title": "How Feedback Works",
  "shots": [
    {
      "id": "loop",
      "template": "flow",
      "headline": "Measure, compare, act",
      "labels": ["Measure", "Compare", "Act"],
      "voice": {"file": "voice/loop.wav", "text": "Measure, compare, then act."},
      "tail": 0.5
    },
    {"id": "end", "template": "card", "headline": "End", "duration": 1.0}
  ]
}
```

Paths use forward slashes and are relative to the episode file. A voiced shot
starts the clip at frame zero and takes its length from ffprobe. Use `tail` to
hold after the voice. A silent shot specifies `duration` in seconds. A voiced
shot with `duration` is rejected. The CLI rejects unknown fields and shot IDs,
missing clips, invalid time values, and duplicate shot IDs. `check` prints JSON
with integer `startFrame` and exclusive `endFrame` values at 30 fps. Use
`npm run --silent production -- check <episode.json>` for agent-readable JSON.
Shot preview and render need media for the selected shot only.

### Compose scenes from named subjects

Use `template: "scene"` when the director needs control within a shot. The
existing templates are also available. A composed shot lists `scene.entities`
and a `scene.camera`. Run the registry to get the full schema, asset names,
channel ranges, easing names, pose vocabularies and light forms.

```sh
npm run --silent production -- capabilities
npm run production -- check examples/composed/episode.json
npm run production -- contact examples/composed/episode.json
npm run production -- assemble examples/composed/episode.json
```

The JSON-only example *Motion, Transfer, Transformation* contains three
different shots: a character carries a sample onto a stand in a landscape, a
causal process reveals and connects named diagram nodes, and a lit tabletop
changes a prop's material appearance, size and form under a moving camera.
The exporter writes `out/production/composed-motion/composed-motion.mp4`.
For a different edit, change the appropriate JSON shot and reuse the same
output directory. The whole scene description is part of that shot's picture
cache key.

- **Subjects.** Combine environmental pieces, seeded people and geometric
  props. Position is a base anchor in right-handed metres with Y up. Rotation
  is yaw in degrees. `scale` is uniform and animatable. `size` multiplies the
  base mesh per axis. Person sizing uses uniform scale and its own material.
  Control paint, opacity, visibility and highlight per subject.
- **Actions.** An action such as
  `{"target":"sample","at":0.3,"duration":1.2,"ease":"inOut","set":{"position":[1,0,0]}}`
  starts in shot-local seconds and controls only its named channels. Position,
  scale, rotation, colour, opacity and highlight interpolate. Pose, expression,
  visibility and asset changes step at the action start. Each channel holds its
  last value. Separate channels can animate together. Overlaps on one channel
  are rejected. Swapping a prop asset preserves its subject ID.
- **Interaction.** A prop attached to a named person uses the person's rotated
  local coordinates. Set `attach` and `position` in an instantaneous action
  to pick up or release a prop. Use `attach: null` with a world position to
  release. The attachment follows the person’s scene transform.
- **Camera.** Set `position`, `target`, optional `fov` and `roll`, then add
  increasing `camera.keys` in seconds. Keys inherit omitted fields. A target
  can be a fixed point or `{"subject":"sample","offset":[0,0.4,0]}`.
  Both camera endpoints resolve their named targets at the sampled time.
  `check` verifies a usable camera-target separation at every output frame.
- **Art direction and education.** Choose a background, fog and Space lights.
  Use shared or local font, size, foreground and background for annotations.
  Anchor text to screen coordinates or to a subject with a leader line.
  Add timed, progressively revealed links with optional arrowheads between
  subjects to build diagrams. These annotations are screen overlays.

The track sampler is stateless. Previewing a frame, revisiting it, and
sampling it inside a complete export use the same time and inputs. The shot
path reuses the Space renderer, procedural asset kits and the production
audio, subtitle, assembly and recovery workflow. Prop swaps are cuts.
Framing and attachment offsets are authored by the director.

### Phase 3 production validation

`examples/airplane-windows/episode.json` is a 15-shot educational episode
authored as composed scenes. `NARRATION.md` contains the spoken script.
`PRODUCTION.md` contains fact-check sources, the production evaluation and
the next engineering priorities.

The pilot needed an opening that exposes the background instead of a
painted patch. The reusable `aperture` asset has a normalized
`opening: [width, height, radius]` on a unit XY panel. The mesh keeps its
hole during scaling, placement and projection. An `outline` asset extrudes an
authored XY silhouette. Scene `paths` project world-space waypoints and support
timed reveals and arrowheads. The capability registry describes their JSON.
These three building blocks work in any composed episode.

From the project root on Linux with the Flite SLT voice installed:

```sh
npm run production:voice -- examples/airplane-windows/episode.json
npm run production -- check examples/airplane-windows/episode.json --require-alignment
npm run production -- contact examples/airplane-windows/episode.json
npm run production:benchmark -- examples/airplane-windows/episode.json out/production/airplane-validation 2
```

The shot holds were authored against the Cloud Flite audio. Check that the
manifest still has 2,700 frames if the speech synthesizer changes. Assembly
produces the MP4 and aligned SRT. To add the selectable English track to the
MP4, remux the two files:

```sh
out=out/production/airplane-validation
ffmpeg -i "$out/airplane-windows.mp4" -i "$out/airplane-windows.srt" \
  -map 0:v:0 -map 0:a:0 -map 1:0 -c:v copy -c:a copy -c:s mov_text \
  -metadata:s:s:0 language=eng -disposition:s:0 default -movflags +faststart \
  "$out/airplane-windows-captioned.mp4"
```

### Phase 4 visual identity and publication workflow

`examples/phase4/HANDOFF.md` records the short approvals cut, measured
benchmarks, provider-independent voice workflow, and remaining visual and
audio limits. Start with `npm run --silent production -- capabilities` to
inspect style profiles, custom overrides, group instances and variants,
narration requests, audio mix inputs, and multi-frame QC.

`examples/phase4/sequence.json` uses one nested cabin across three camera
angles. Override with `--style editorial`, `--style cinematic` or
`--style illustrated` for the three 12-second tests. There is a separate
`audio.json` with local narration and measured timings. Keep longer episode
production behind the visual style approval gate. The 90-second Phase 3
pilot from `1d54fb0` remains the comparison baseline.

### Claude Code handoff verification (2026-11-25)

Claude Code recovered `06d4143` from GitHub (`codex/production-pipeline-mvp`,
pushed by the owner). The history is linear on `c4607bf`: `404b042`, `46a0590`,
`cd7f17e`, `1d54fb0`, `06d4143`. No bundle import was needed. On a separate
4-core Linux cloud container (15 GiB, Chromium 1243, FFmpeg 6.1.1, Node 22):

- `npm ci`, type checking, 60/60 unit tests and legacy QC (0 errors, 0 warnings) passed.
- All 20 visual plates matched at 0.000 % and the determinism re-render matched.
- Phase 4 samples, cold / warm assembly: editorial 45.1 s / 1.26 s, cinematic
  38.0 s / 1.31 s, illustrated 38.6 s / 1.33 s. Each MP4 is 360 frames at
  1080p30 and decodes cleanly. The audio demo assembled with
  `--require-alignment` in 39.8 s. Multi-frame QC and the contact sheet ran.
- The 90-second pilot reproduced from scratch (Flite voice → check
  `--require-alignment` → benchmark, concurrency 2): 2,700 frames, 90.000 s,
  23 SRT cues, full decode. Cold 225.19 s, peak RSS 2.72 GiB; warm 5.96 s with
  15/15 cached shots, peak RSS 0.28 GiB.

Observations: multi-frame QC raises about 430 `projected-overlap` flags per
style on the nested cabin, because the bounding boxes of set pieces overlap by
design. It needs group-aware suppression before it can flag real defects. The
three profiles share geometry, framing and blocking, so the comparison mainly
tests palette, material, type and transitions, not composition. The status
row "Approved: Cinematic Geometric Editorial" in §2 predates Phase 4. Treat
style selection as open until the owner approves a profile. Apple Silicon
numbers are still unmeasured.

### Cache and recovery

Edit the JSON for one shot and run
`npm run production -- render <episode.json> <shot-id>`. Then run
`npm run production -- assemble <episode.json>` with the same output directory.
The isolated render writes `shots/<shot-id>.mp4` with audio. Assembly logs each
`Cache hit` and `Rendering` decision to stderr. Use `render --force` to regenerate
the selected picture explicitly.

The picture key hashes visual props, frame count, renderer code and bundled
assets, the lockfile, and browser/platform identity. Audio or transcript-only
changes reuse the picture when shot length is unchanged. Assembly regenerates
the audio and subtitles for the current inputs. Completed cached pictures are
published atomically under `.cache/` and checked for H.264, dimensions, frame
rate and frame count before reuse. Rerun the same assembly after interruption.
Files staged under `.write-*` are ignored. A hard kill can leave those
directories behind. Remove them only after all renders in that output directory
have stopped.

### Subtitle alignment

Assembly concatenates mono 48 kHz PCM at exactly 1,600 samples per frame before
one AAC encode. The CLI looks beside each narration asset for
`<voice.file>.timing.json` and uses its word timings for SRT directly. The
Linux voice generator writes the WAV and timestamps from one Flite synthesis.
For recorded or macOS-generated narration, supply timestamps from your
alignment tool or edit explicitly measured boundaries into the sidecar.
Automatic forced alignment of arbitrary recorded speech is pending.

A version 1 sidecar contains `source` (provider name), `audioSha256` (hex SHA-256
of the exact exported narration file), `transcript` (verbatim `voice.text`),
and `words` (one ordered `{text, start, end}` object per whitespace-separated
word). Timestamps are seconds relative to the audio file. The CLI rejects
stale hashes, transcript discrepancies, overlaps, and out-of-range timestamps.
Without a sidecar, the CLI can estimate captions and reports the affected shot
IDs at export. Use `--require-alignment` on `check`, `srt`, or `assemble` for
exports that must use aligned captions.

### Mac mini benchmark

Generate the voice files first. Set `REMOTION_BROWSER_EXECUTABLE` to your
local Chromium or Chrome binary. Start with concurrency 2 and a fresh output
directory per run. Use the feedback pilot for the long benchmark and the river
episode for a shorter check.

```sh
npm run pilot:voice
REMOTION_BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  npm run production:benchmark -- examples/pilot/episode.json out/benchmarks/mac-mini-2 2
```

The benchmark records cold and warm wall time, sampled peak process-tree RSS,
shot reuse, video duration and system details in `benchmark.json`. Cold and
warm logs are stored beside it. Voice synthesis runs outside the timed stages.
Peak RSS is sampled every 200 ms and may count shared pages more than once.
Mac mini performance has yet to be measured.

### Verification

The composed demo exported 378 frames (12.6 seconds) at 1080p and 30 fps.
The complete MP4 decoded successfully. Two independent frame-100 previews
matched byte-for-byte. Three cached pictures were reused on warm assembly.
Changing a nested rotation action rendered only the diagram shot. The
unaffected pictures retained their SHA-256 hashes.

On Linux, the standalone *Why Rivers Bend* episode exported 870 frames
(29.0 seconds) at 1080p and 30 fps with AAC narration and aligned SRT. FFmpeg
decoded it end to end. Its four-shot benchmark at concurrency 2 measured
144.31 seconds cold with 2.54 GiB peak process-tree RSS. The warm run reused
all four pictures in 2.52 seconds with 0.24 GiB peak RSS.

In an integration run, an equal-duration headline edit rendered only the
`banks` shot. Reassembly then hit all four cache entries, and the prior
pictures retained their SHA-256 hashes. A hard kill while a later edit to
`migration` was staged preserved the last assembled MP4. The retry reused
the three completed pictures and rebuilt only `migration`. Replacing that
cache entry with invalid MP4 bytes triggered the same isolated rebuild.
The final 870-frame output decoded successfully. A 480 × 270 shot preview
and a four-cell contact sheet matched their requested frames and shot order.
The feedback pilot also exported 16 aligned cues directly through
`production -- srt --require-alignment`.

Type checking and all 60 unit tests passed. Both shipped legacy episodes
reported zero QC errors and zero warnings. All 20 Linux visual goldens passed
without updates, and the determinism PNGs were byte-identical.

On the Linux cloud workstation with Chromium and FFmpeg 7.1.5, the pilot was
65.667 seconds with 1,970 consecutive 1080p frames at 30 fps and an AAC audio
stream. FFmpeg decoded the whole export without errors. Comparing the decoded
audio to each of the eight source clips at 8 kHz found no offset at that sample
resolution. The 16 SRT cues were ordered, at most two lines each, and within
their corresponding voice windows. Frames sampled from every shot were inspected
for framing and layout. The demo uses synthetic narration and remains an
engineering sample for editorial review.

The initial cloud assembly took about 5 minutes 22 seconds at concurrency 2.
Warm reassembly with all eight picture cache hits took about 4.8 seconds. These
measurements apply to this pilot and workstation. A three-shot integration test
changed one equal-duration shot, forced its rerender, and reassembled 73 frames.
The prior cache artifacts had identical SHA-256 values and two independent PNG
previews of the edited shot were byte-identical. A different shot was also
previewed in an episode containing an unavailable voice asset. Missing media,
unknown shot IDs, conflicting timings, and malformed legacy JSON failed with
actionable diagnostics.

To check the exported streams and total frame count independently:

```sh
ffprobe -v error -show_entries stream=codec_name,codec_type,width,height,avg_frame_rate,nb_frames,duration -of json \
  out/production/feedback-pilot/feedback-pilot.mp4
ffmpeg -v error -i out/production/feedback-pilot/feedback-pilot.mp4 -f null -
```

### Current limits

- The production CLI currently exports landscape. Legacy vertical export remains
  available. Intentional vertical reframing is future work.
- One voice asset per shot. Music, effects, overlapping narration, transitions,
  automatic alignment of arbitrary recorded speech, rendered-frame QC and automated corrections remain outside
  the production CLI. Shot exports use hard cuts and headline/diagram overlays.
- No production Mac mini benchmark yet. Linux runs validate the pipeline and
  provide a cloud baseline only.
- The legacy ToonScript compiler rejects malformed input and conflicting or
  missing measured audio durations. Run `npm run sync-audio` when replacing
  legacy voice clips. Set actor `y` and `scale` at scene entry. Legacy actions
  cannot animate those fields.

## 2. Status (current)

| Area | State |
| --- | --- |
| Script → video (JSON) | Production CLI: standalone narrated shot JSON, 1080p, shot previews and contact sheets, cache recovery, aligned SRT, MP4, and JSON-composed 3D scenes. Legacy ToonScript still supports dialogue, 16:9, 9:16 and thumbnails. |
| Visual direction | **Cinematic Geometric v3 provisionally approved** as the working direction (Phase 4.1). No permanent identity lock. Machine-style cutaways approved as a priority technique. Current footage NOT approved for publication |
| Rig | Puppet rig v2: full skeleton, IK arms and legs, planted feet, look-at, lean/anticipation, secondary motion |
| Props | Parenting to world / one hand / two-hand carry with smooth hand-offs |
| Environments | **Space kit**: real 3D perspective with flat-shaded geometry, procedural architecture (atrium generator), lighting model, height fog. Plus the 2D parallax kit from v2 |
| Concept visuals | Network kit in 2D and 3D (grow, recall wave, persistent glow, fade, dissolve), particle bursts. Labeled flow diagram exposed in the production CLI. Broader chart library pending |
| Cinematography | Shot sequencer + **semantic shot grammar** (establishing, closeUp, objectReveal, tracking, cutaway, scaleTransition); see `docs/SHOT_GRAMMAR.md` |
| Look system | Shared identity (`src/themes/cge/identity.ts`): banded light, cool-shadow and warm-light tints, matte/metal/glass/water materials, low coloured haze, planar cast shadows |
| Characters | **Person v2** (`src/themes/cge/Person.tsx`): faceted design system, proper hands, procedural cast variation; the Archivist is one preset. **Front, profile and back views** chosen automatically from the camera angle; **10 data-driven expressions** (`face.ts`). **Provisionally approved for wide and medium shots**; close-ups not approved. NOT locked |
| Renderer | SVG Space renderer kept; Three.js evaluated with a measured spike; hybrid recommended (`docs/RENDERER_ASSESSMENT.md`) |
| QC | Static QC (composition, readability, sync, movement, repetition, pacing), unit tests, visual regression, determinism, benchmarks |
| Automation | Claude Code or Codex drives production through standalone JSON and the CLI. Embedded director deferred. **Gap:** the strongest footage (v3, versatility) is code-authored; JSON parity is the Phase 4.1 priority (section 4.1) |

### Phase 4.1 directive (2026-11-25)

Codex completed an independent visual and technical audit. Owner decisions:

- Cinematic Geometric v3: provisionally approved as the working visual direction.
- Person v2: provisionally approved for wide and medium shots.
- Machine-style cutaways: approved as a priority educational storytelling technique.
- Current footage: not approved for publication. No permanent visual identity lock.

**Primary architectural concern (Codex):** the strongest demonstrations are code-authored
prototypes and do not establish equivalent capabilities in the JSON production pipeline.
The objective is an autonomous engine, not a collection of individually programmed
videos, so closing this gap is the highest priority. Codex also reported an occlusion
defect in the Urban tram shot (section 9).

Tasks, in order: (1) capability parity audit (done: section 4.1), (2) rendering
correctness (tram occlusion, reusable depth ordering, regression tests), (3) animation
and choreography (continuous turns and three-quarter views, weight transfer, prop
attach/release, grip positioning, continuity across cuts, foreground obstruction
detection), (4) visual polish within the existing style (contact shadows, local light,
material variation, environment detail, title contrast, mobile-readable callouts, less
repetition) at reasonable cost on the Mac mini, (5) narration and audio audit (done:
section 4.1), (6) a 60–90 s narrated editorial test built through JSON alone with no
episode-specific code, measured authoring and render time, and multi-frame QC.
Major architectural changes wait for owner review of the plan in section 10.

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

## 3.1 Benchmark v3: Cinematic Geometric Editorial (provisionally approved, Phase 4.1)

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

## 3.2 Versatility benchmark + Person v2 (Person v2 provisionally approved for wide and medium shots)

Four 5-second scenes plus two character design sheets, all in one identity and built only from reusable kits. Compositions: `V-Urban`, `V-Machine`, `V-Nature`, `V-Abstract`, `Character-Sheet`, `Character-Turnaround`.

| Scene | Subject / light | Shots (semantic grammar) | Engine capabilities |
| --- | --- | --- | --- |
| Urban | Bright late-morning street, tram, cars, crowd | `establishing` → `tracking` (chase) | City kit (seeded buildings: massing, window rhythm, cornices, balconies, shopfronts, awnings, rooftops), street, lamps, vehicles, crowd walkers, procedural people, planar sun shadows |
| Mechanical | Studio light, cutaway gearbox | `objectReveal` → `cutaway` | Mechanics kit (meshing gears at correct ratios, crank-slider, cutaway housing with painted sections, half sleeve), metal shading, 3D-tracked callouts |
| Natural | Afternoon valley, river, forest, mountains | `tracking` (drone glide) | Terrain kit (heightfield, carved river, slope/height colouring, flattened water), procedural trees (broadleaf and conifer), rocks, mountains, water ripples, birds, colour-shifted haze |
| Abstract | Dawn plane, surreal floating forms | `closeUp` → `scaleTransition` | Formation-morph kit (one cube becomes 140 steps of a monumental spiral), long cast shadow, extreme scale contrast |

**Art direction changes in response to v3 feedback:**
- **Haze:** lowered to density 0.003–0.006, and coloured (blue at distance, warm near the horizon) instead of white wash.
- **Colour relationships:** every scene keeps the identity anchors (vermilion accent, amber energy, cream, ink, teal), and its local palette uses the same cool-shadow / warm-light tint, so a city, a machine, a valley and a dawn plane read as one channel.
- **Materials:** stylized response, not photoreal. Banded light, a single metal/glass/water highlight band, painted cutaway sections.
- **Less repetition:** every building, tree, rock, person and shelf varies by seed.
- **Unchanged:** the cinematic composition, scale, camera system and editorial typography.

**Person v2 (character design, exploratory):**
- **Same language as the environments:** faceted planes, banded lit/shadow tones and the same tints.
- **Head:** a faceted profile (brow, nose, lips, chin, jaw), an almond eye with lid line, a wedge brow.
- **Hands:** palm, four finger strips and thumb, with relaxed, hold and open poses.
- **Outfits and hair:** coat, jacket, sweater, dress; bob, short, bun, long, beanie.
- **Variation:** height, build, skin, hair and palette, plus a bag.
- **Presets and crowds:** `randomPerson(seed)` produces a consistent, varied cast; the Archivist is a preset.

**Views and expressions (round 2, provisionally approved for wide and medium shots; `Character-Turnaround`):**
- **Front and back views** alongside the profile. The rig takes a `view` (`src/kit/puppet.ts`): seen from the front, forward reaches land just inside the shoulders, feet stand side by side and a stride shows as lift, and a forward lean no longer rolls the torso.
- **Automatic view choice:** `chooseView()` shows the front or back when the character faces within about 40° of the camera axis, otherwise the profile. `personSprite` applies it per frame, so the urban crowd walking along the street now shows faces and backs. A `view` on the placement overrides it.
- **Expression set as data** (`src/themes/cge/face.ts`): neutral, smile, laugh, content, wonder, concern, sad, angry, thinking, determined. Each is brow (lift, inner angle), eye (opening, cheek squint, gaze) and mouth (width, curve, opening, skew). The same data drives the profile and front faces.
- **Front design:** symmetric faceted head with a jaw facet on the shadow side, a nose wedge, two almond eyes, ears for short hairstyles; lapels, collar, scarf wrap, bag strap; half-body shading from the key-light side. **Back design:** hair masses per hairstyle, coat vent and collar.

**Known weaknesses (for the next round):**
- **Views:** no three-quarter front yet (the jump profile → front is a cut, with no turn in between); the key-light side for front views is a fixed default, not derived from the scene lights; held props need front-view attachment points.
- **Expressions:** no transitions between expressions yet (they switch), and talking is still a two-frame mouth flap (visemes come with the voice pipeline).
- **Mid-shot blocks:** in the abstract scene, blocks close to the camera are large mid-transition.
- **Terrain facets:** large near-camera terrain facets read as flat.
- **Composition checks:** the camera is not yet automatically kept out of geometry or occluders; the director must pick safe parameters (see `docs/SHOT_GRAMMAR.md`).

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

## 4.1 JSON capability parity (Phase 4.1 audit, 2026-11-25)

Section 4 lists what the engine can do in code. This audit asks what an AI director can
do **through production JSON alone**, compared with the code-authored v3
(`src/prototypes/memory3`) and versatility (`src/prototypes/versatility`) demonstrations.

**Headline finding.** The production templates `urban`, `machine`, `nature` and
`abstract` (`src/production/index.tsx`) replay the fixed five-second prototype
compositions, retimed to the shot length with an optional headline. They cannot be
directed. The only composable path is the `scene` template (`src/production/scene/`):
up to 64 entities from 8 props (`box`, `cylinder`, `cone`, `sphere`, `rock`, `car`,
`aperture`, `outline`), 5 environment assets (`ground`, `tree`, `conifer`, `platform`,
`mountain`) and `person`, plus timed property actions, keyed camera, lights, fog and
overlays. Every kit behind the strong footage (atrium, city, terrain, mechanics,
library, network, particles, formation, shot grammar, prop hand-offs, puppet input) is
reachable only from TypeScript.

Legend: **JSON** available to a director now · **Partial** some of it in JSON ·
**Code** exists only as a kit or prototype · **Missing** exists nowhere.
Effort: S ≤ 1 day, M 1–3 days, L about a week of agent work.

| Area | JSON today | Code-only today | Missing reusable primitive | Status | Effort |
| --- | --- | --- | --- | --- | --- |
| Hierarchical composition | Episode `library` groups: nested (8 deep), variants, optional dressing, position/yaw/scale (`scripts/lib/production-composition.ts`) | `SceneDef.build(t)` composes kits freely | Groups expand to flat entities at load, so an assembled object cannot move, turn or hide as one unit; parenting only prop→person; 64-entity cap after expansion | Partial | M |
| Hand and prop choreography | `attach` puts a prop at a fixed offset from the person's origin, stepping instantly ("not hand IK") | `kit/props.ts` world / one-hand / two-hand carry anchors with blended hand-offs; `held` render on hands; hand poses relaxed/hold/open; reach and offer IK in v3 | Attach to a named hand or carry point, grip pose, reach target, blended attach and release; prop-to-prop attach | Code | M |
| Character animation | 8 poses, 10 expressions, walking derived from position moves, heading from rotation, automatic front/profile/back view | v3 Archivist timeline: blended arm poses, lean, anticipation, look-at, light-aware skin | Continuous turns and three-quarter views (nowhere), expression blends, look-at target, weight transfer in walks, talking flag in `scene` shots | Partial | L |
| Environment construction | Primitive props and 5 nature assets; ground is a single 24 m quad | Atrium generator, city building/street/lamp/tram/car, terrain heightfield with river, scatter, shelves and books, gears/crank-slider/cutaway housing/half sleeve, formation morph | Parametric generator assets in JSON (`gear`, `cutaway`, `building`, `street`, `terrain`, `atrium`, `scatter`) with seeds and sizes | Code | M per family, L total |
| Lighting and focal effects | 4 light kinds (max 8), height fog, profile `look` bands, emissive `highlight` | Depth-of-field bands (`Space` `dof`, wired only in `SceneFrame`), volumetric beam, motes and bursts, glowing orbs, vignette, film grain | DOF / focus subject on camera keys; localized light pools; contact shadows; particles as entities | Partial | S (DOF, grain) to M |
| Camera direction | Raw keys: position, target or followed subject, FOV, roll, easing on straight-line paths | Shot grammar (`kit/shotGrammar.ts`): establishing, closeUp, objectReveal, tracking, cutaway, scaleTransition, with orbit arcs and handheld drift | Named shots in JSON resolved against subjects; arc paths; line-of-sight / foreground-obstruction check | Code | M (highest leverage) |
| Cross-shot continuity | None: each shot declares its own world; library groups reduce repetition | v3 keeps one world across four shots by construction | Episode-level sets shared by shots; entity state carried across cuts (positions, attachments, motion); match-cut helper | Missing | M |
| Material styling | Per-entity kind (flat/matte/metal/glass/water), palette tones, colour, style profile | Per-face materials (`FaceMats`), cutaway section colour, seeded colour variation, occlusion | Per-face or per-part materials and seeded variation in JSON; section material for cutaways | Partial | S–M |
| Object layering and depth | Painter's order only; no JSON control; overlays always on top | Hand-tuned `bias` per kit polygon | Object-level depth groups (section 9, tram defect) and occlusion-aware callouts | Partial (defective) | M |
| On-screen text | Annotations (subject or screen anchor, reveal), links, paths, template headline | Display title + kicker, chapter marks, scrimmed subtitles, leader-line callouts (Machine) | Title and chapter blocks, callout style, minimum mobile text size and contrast rules in QC | Partial | S |
| Concept visuals | Links and paths between subjects | 3D memory network with hop-by-hop recall, particle bursts, motes | Network and particle generators as entities | Code | M |

**Existing pieces to reuse, not rebuild:** library groups and variants; `kit/props.ts`
hand-off blending; `kit/shotGrammar.ts`; `Space` DOF; `chooseView`; `kit/mechanics.ts`;
production QC sampling and contact sheets; the narration request/import contract.

### Narration and audio (audit of the Phase 4 implementation)

| Piece | State |
| --- | --- |
| Provider-independent narration | **Done.** `production narration` exports requests with pronunciation aliases; any provider's WAV is imported with a SHA-bound word-timing sidecar. Paid TTS stays optional. |
| Local voices | Linux: flite SLT with word timings (`scripts/flite-voice.py`, needs `libflite.so`). macOS: `say` with **no** timings. The Phase 4 demo used Piper (LJ Speech), but no script wraps Piper and it is not installed on the Mac mini. |
| Alignment | Optional PocketSphinx aligner (`scripts/align-narration.py`), dictionary-based. **Not installed on the Mac mini**, so Mac narration today gets estimated captions. |
| Mixing | Music bed with sidechain ducking, timed effects with gain and loop, single-pass loudness on the voice only, limiter, mono AAC. |
| Gaps | (1) a scripted natural local voice on the Mac (Piper or a macOS premium voice) plus a working aligner; (2) **visual cues keyed to narration words** (actions use shot seconds only), needed for picture-narration sync; (3) talking and visemes in `scene` shots; (4) final-mix loudness to a target (e.g. −14 LUFS) and stereo output; (5) pauses beyond shot lead/tail; (6) effects tied to actions. |

## 5. Target architecture (automation)

The workflow below describes the longer-term design. The production MVP in §1.1
uses Claude Code and Codex as external directors. An embedded LLM is deferred.

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
| `npm test` | 60 unit tests: compiler validation and timing, production plans and SRT, determinism, QC detectors, speech timing, rig/IK, planted feet, prop hand-offs, network propagation, procedural assets, the prototype's carry/place logic |
| `npm run check` | Compiles every script and runs QC: overlap, off-screen/cropped speakers (both formats), fast speech, long Shorts subtitles, short captions, line overlap, sliding walks, pose flicker, repeated gestures, repeated backdrops, pacing metrics |
| `npm run test:visual` | Renders 20 key frames and compares them with approved goldens (per platform), plus a determinism re-render. `-- --update` approves a new look |
| `npm run benchmark` | Render speed, real-time factor, projected 10-minute render time, peak memory of the whole render process tree, versatility counts, authoring effort |

**Not yet covered:** checks on rendered pixels (text contrast, clipping detected from
the DOM, safe areas), audio drift against real VO files, unnatural joint angles.

## 8. Benchmarks

Latest numbers are in `benchmarks/LATEST.md`; history is in `benchmarks/results.json`.
The Mac mini baseline was measured on 2026-11-25 (table below). The default
`npm run benchmark` set covers Ep001 and prototypes A/B/C; v3 and the versatility
compositions have no Mac numbers yet. Visual goldens exist for both `linux-x64` and
`darwin-arm64` (the Mac set differs from Linux by at most 0.7% of pixels, from font
rasterisation).

| Benchmark | Current measure |
| --- | --- |
| Visual quality | Prototypes A/B/C; protected by visual regression; judged by eye (no automatic score) |
| Versatility | 5 cast presets, 8 poses × 7 expressions, 4 default backdrops + 1 modular set (11 module types), 3 themes |
| Automation | Production check → preview one shot → render one shot or assemble the episode. Claude Code and Codex author the input JSON. |
| Performance | See the table below |
| Reusability | New JSON episodes need zero code. New *visual* actions still need code (roadmap 1.3) |

**Mac mini** — measured 2026-11-25 on Apple M6 (12 cores, 25.8 GB, macOS 27.0.1,
Node 26.13.1), Remotion default concurrency:

| Composition | Video | Render | × real time | Projected 10-min video | Peak memory |
| --- | --- | --- | --- | --- | --- |
| Default style (Ep001 Long, 1920×1080) | 43 s | 12.7 s | 0.30× | 3 min | 4.3 GB |
| Default style (Ep001 Short, 1080×1920) | 43 s | 11.4 s | 0.27× | 2.7 min | 3.5 GB |
| A · Geometric | 15 s | 4.4 s | 0.30× | 3 min | 3.5 GB |
| B · Textured | 15 s | 17.9 s | 1.19× | 12 min | 5.8 GB |
| C · Cinematic | 15 s | 75.3 s | 5.0× | 50 min | 7.5 GB |

Second Mac mini run (2026-11-25, same machine, `npm run benchmark -- <ids>`), the
compositions outside the default set:

| Composition | Video | Render | × real time | Projected 10-min video | Peak memory |
| --- | --- | --- | --- | --- | --- |
| **v3 · Cinematic Geometric** | 18 s | 49.7 s | 2.76× | 28 min | 8.0 GB |
| Versatility · Urban | 5 s | 4.5 s | 0.91× | 9 min | 4.6 GB |
| Versatility · Mechanical | 5 s | 3.9 s | 0.78× | 8 min | 4.0 GB |
| Versatility · Natural | 5 s | 5.0 s | 1.00× | 10 min | 5.0 GB |
| Versatility · Abstract | 5 s | 3.9 s | 0.78× | 8 min | 4.3 GB |
| Character sheet / turnaround | 3 s | 1.2 s | 0.40× | 4 min | 2.9 GB |

Both runs are in `benchmarks/results.json`; `benchmarks/LATEST.md` shows the default set.

The Mac renders 2.7–8× faster than the cloud Xeon (v3: 3.4×). Peak memory is higher (more
parallel Chromium tabs at default concurrency) but stays under a third of the RAM.

**Linux cloud** — measured 2026-11-24 on a 4-core cloud Xeon, 1920×1080, Remotion default concurrency:

| Composition | Render for 15 s | × real time | Projected 10-min video | Peak memory |
| --- | --- | --- | --- | --- |
| Default style (Ep001, 43 s) | 69 s | 1.6× | 16 min | 1.8 GB |
| A · Geometric | 35 s | 2.3× | 23 min | 2.2 GB |
| B · Textured | 105 s | 7.0× | 70 min | 2.7 GB |
| C · Cinematic | 207 s | 13.8× | 138 min | 3.6 GB |
| **v3 · Cinematic Geometric (18 s)** | 171 s | 9.5× | 95 min | 3.8 GB |
| Versatility · Urban (5 s) | 23.5 s | 4.7× | 47 min | 2.6 GB |
| Versatility · Mechanical (5 s) | 19.2 s | 3.8× | 38 min | 2.4 GB |
| Versatility · Natural (5 s) | 26.9 s | 5.4× | 54 min | 2.9 GB |
| Versatility · Abstract (5 s) | 18.8 s | 3.8× | 38 min | 2.4 GB |

Renderer comparison (same 60 frames): Space SVG 209 ms/frame vs Three.js 324 ms/frame on software WebGL (no GPU). See `docs/RENDERER_ASSESSMENT.md`.

All fit comfortably in 24 GB on both machines. C's cost is dominated by blur filters (depth of
field, bloom, soft shadows); B's by per-frame ink jitter on ~1,000 shapes. Both have
known optimisations (cache static layers as images, pre-blurred sprites, jitter
only on the stage layer) that are deferred until the look is locked.

## 9. Known limitations

- **Occlusion errors from per-polygon depth sorting (Urban tram, reported by Codex).** `Space` sorts each polygon by the average camera depth of its vertices and each sprite by one anchor point. The tram is built from single 16 m faces (`kit/city.ts` `tram`), so in the chase shot pedestrians on the far sidewalk, behind the tram but nearer the camera than the face centres, are drawn on top of the tram roof. Any long or large polygon can fail the same way; kits work around it with hand-tuned `bias`. Proposed fix: object-level depth groups (section 10, item A1).
- **Choreography of rich scenes is hand-keyed** (prototype `scene.ts`); production JSON exposes only the primitives in section 4.1.
- **Default style (Ep001/Ep002) predates the theme contract** and uses the older rig. Port it once the visual direction is locked.
- **Lip sync** is generic mouth flapping; word timing is estimated unless real audio is synced per line.
- **Character views** are front, profile and back with hard switches; no three-quarter front or animated turns yet. The default style (Ep001) still has one view.
- **No rendered-pixel QC yet:** text contrast and real clipping are not machine-checked.
- **Render cost of style C/B** is high (blur filters; per-frame ink jitter). Optimisation is deliberately deferred until the look is locked.
- Visual goldens are platform-specific; regenerate on each machine (`npm run test:visual -- --update`).

## 10. Revised roadmap (Phase 4.1)

Goal: an AI director produces footage of v3 quality **through JSON alone**. Ranked by
how much each item closes the parity gap (section 4.1), respecting dependencies. Every
item extends an existing kit or schema; nothing duplicates existing functionality.
Effort: S ≤ 1 day, M 1–3 days, L about a week. **Status: proposed, awaiting owner review
before the architectural items (A1–A3) start.**

| # | Item | Directive task | Effort | Depends on |
| --- | --- | --- | --- | --- |
| **A1** | **Object-level depth groups** in `Space`: each object (mesh group, sprite) gets one sort key from its nearest bounds, ties broken by a ground-footprint separating-axis test; polygons sort within their object. Make sorting a pure, unit-tested function. Regression tests: a tram-and-walker scene swept through camera azimuths and object motion, plus the Urban chase frames. Removes most hand-tuned `bias`. | 2 | M | — |
| **A2** | **Shot grammar in JSON:** `camera: {shot: "objectReveal", subject, ...}` resolved by `kit/shotGrammar.ts`, arc paths, DOF/focus subject on keys, line-of-sight check that flags or shifts when foreground geometry blocks the subject. | 3, 4 | M | A1 (occlusion test reuse) |
| **A3** | **Animated groups and attachment:** group instances keep a parent transform that actions can move, turn, scale and hide as a unit; attach any entity to any entity or to a named hand / carry point (reusing `kit/props.ts` hand-off blending); raise the entity cap where render cost allows. | 1, 3 | M | — |
| **A4** | **Episode sets and continuity:** shots reference shared episode-level sets; entity state at the end of a shot can seed the next (positions, attachments, motion) for continuity across cuts. | 3 | M | A3 |
| B1 | **Mechanics family as JSON assets** (approved priority): `gear` (teeth, meshing to a driver), `crankSlider`, `cutawayHousing`, `halfSleeve`, section material, plus leader-line callouts. Then city, terrain and atrium generators. | 1, 6 | M, then L | A3 |
| B2 | **Character choreography:** continuous turns with three-quarter views, weight transfer in walks, look-at targets, expression blends, grip poses and blended attach/release, all as action fields. | 3 | L | A3 |
| B3 | **Narration-driven timing:** action and camera times keyed to narration words (`at: {word: 3}` or a cue name); talking and visemes in `scene` shots. | 5, 6 | M | C1 |
| B4 | **Visual polish within v3:** selective contact shadows, localized light pools, seeded material variation, environment detail and LOD to reduce repetition, title scrim with a contrast check, minimum mobile text size for callouts in QC. Keep the Mac render budget. | 4 | M | A1 |
| C1 | **Audio on the Mac:** script a local natural voice (Piper, or a macOS premium voice) as a provider, install and verify the aligner, final-mix loudness target and stereo, effects tied to actions. Keep paid TTS optional. | 5 | S–M | — |
| C2 | **Occlusion and readability QC:** sampled-frame checks for blocked subjects, text contrast and mobile text size, building on production QC. | 4, 6 | M | A1, A2 |
| **D** | **60–90 s narrated JSON editorial test** in the v3 language with machine cutaways, no episode-specific code, measured authoring time, render time and memory, multi-frame QC. | 6 | M | A1–A3, B1, B3, C1 |

Suggested order: A1 → A3 → A2 → B1 → C1 → B3 → A4 → B2 → B4 → C2 → D. A1, A3 and C1
are independent and can run in parallel on separate branches.

Earlier roadmap items still open, now folded in: 0.5 (character views and expressions → B2),
0.6 (shot grammar next steps → A2), 1.3 (action vocabulary → A3, B2), 2.1 (voice pipeline
→ C1, B3), 2.2 (diagram library → B1), 3.1 (rendered-frame QC → C2), 3.2 (environment sets
→ B1). Still separate: 0.7 renderer decision (measure the Three.js spike on the Mac mini
GPU; a per-pixel depth buffer would also solve A1, but is not needed for it), 1.1 light
rig, 1.2 character part system, 1.4 port default episodes, 2.4 YouTube metadata,
3.3 performance pass, 4 retention-driven pacing.

## 11. Working with multiple agents

### Where the project lives

- **The owner's Mac mini is the primary home.** It holds the working copy, renders
  full-length episodes, runs the Apple Silicon benchmarks and keeps all large output.
  It is not left on for remote access.
- **GitHub is the shared source of truth.** Claude Code and Codex cloud sessions work
  from GitHub while the Mac is off. They run tests and short preview renders in the
  cloud and push their branches. Nothing reaches the other side unless it is pushed.
- **`engine` is the main branch.** It replaces `codex/production-pipeline-mvp`. The
  old Flutter game (`claude/flutter-idle-rpg-mvp-4vlqsp`, still the GitHub default
  branch until the owner changes it) is retired.
- **Large files never go to git.** Renders, shot caches (`out/**/.cache`), review packs,
  bundles and benchmark logs live under the ignored `out/` folder. Commit only code,
  episode JSON, docs, small audio stems with their timing sidecars, and approved goldens.

### Sync rules

- **On the Mac:** `git pull` before starting and push before walking away.
- **Agent sessions:** start from the latest `engine`, work on a separate branch, and
  merge into `engine` only after the checks below pass. Always push the result. A
  session that cannot push must say so immediately, not hand off a bundle silently.
- **Hand-off notes** go in this file (or an `examples/*/HANDOFF.md` it links), never
  only in a chat or a review tab.
- Measurements from the cloud are labelled as Linux cloud results. Mac mini numbers
  are only recorded from runs on the Mac.

### Roles and checks

- Claude Code is the primary developer; Codex reviews and optimises.
- Each agent works on **its own git branch**; never edit the same files at the same time.
- Reviews rank findings by impact and effort against the benchmarks (section 8) and cite `file:line`.
- Before any commit: `npm run typecheck && npm test && npm run check`. After visual changes: `npm run test:visual`.
