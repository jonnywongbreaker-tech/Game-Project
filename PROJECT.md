# Toon Engine: project guide

## Goal

Produce professional-looking 2D animated YouTube videos (long-form and Shorts) at scale,
with minimal manual work per video and near-zero generation cost. The engine is
niche-independent: swap the cast, backdrops and style to serve any topic.

## Benchmarks

Every change should move at least one of these forward without regressing the others.

| # | Benchmark | Question | How we measure it today |
| --- | --- | --- | --- |
| 1 | Visual quality | Does it look professionally animated, not programmatic? | Render the RigTest + sample frames; review by eye |
| 2 | Versatility | Can it express thousands of different scenes? | Count of poses, expressions, backdrops, props and camera moves |
| 3 | Automation | How much human work per video? | Steps from script to upload; target: write JSON → one command |
| 4 | Performance | How fast does a 10-minute video render on a Mac mini? | `time npm run render -- <id> --long` |
| 5 | Reusability | Does each new video get easier? | New episodes need zero engine code changes |

Baseline: a 43 s episode renders as 16:9 + 9:16 + thumbnail in ~2.5 min on a 4-core
cloud container. Apple Silicon should be faster.

## Architecture

```
JSON script ──► compile.ts ──► CompiledEpisode ──► ScriptEpisode.tsx ──► Remotion ──► MP4 / PNG
 (what)         (validate +     (absolute-time     (draws one frame         16:9, 9:16,
                 schedule)       timelines)          at time t)              thumbnail
```

- **`src/script/`**: the script layer.
  - `types.ts` defines the JSON format (ToonScript).
  - `compile.ts` is pure TypeScript with no React. It validates a script and turns beats
    into keyframe tracks (position, pose, expression, camera), speech lines with word
    timings, captions and sound cues. It reports issues instead of crashing.
  - `ScriptEpisode.tsx` renders a compiled episode at any frame size.
- **`src/engine/`**: reusable building blocks, also usable directly from code.
  - `time.ts`: everything is authored in **seconds**. `tween`, `keyframes`, `step`, `move`, `wave`, `shake`.
  - `Camera.tsx`: one 1920×1080 world. 16:9 shows all of it; 9:16 shows a slice centred on `focusX`.
  - `Character.tsx`: SVG puppet with blended poses, distance-synced walking, blinking, expressions,
    lip-flaps and emotes.
  - `designs.ts`: the recurring cast (`CAST_PRESETS`).
  - `Backdrop.tsx`: park, room, city, studio.
  - `speech.ts`: line and word timing, who's talking. `overlays.tsx`: subtitles, captions, scene fades.
  - `vocab.ts`: the single list of valid poses, expressions and backdrops (used by the compiler and the types).
- **`src/episodes/`**: episode content. JSON scripts plus code episodes (escape hatch, e.g. `RigTest.tsx`).
- **`scripts/`**: `check.ts` (lint), `render.mjs` (batch export), `sync-audio.mjs` (measure voice-over).

### Design rules

1. **Seconds, not frames**, everywhere in authoring APIs.
2. **The compiler stays pure.** No React or Remotion imports in `src/script/compile.ts`,
   `src/engine/vocab.ts`, `speech.ts` or `designs.ts`, so Node tools can run them.
3. **One scene, every format.** Never build separate scenes for Shorts; use the camera.
4. **Deterministic.** Use Remotion's `random(seed)`, never `Math.random()`. The same frame must render identically every time.
5. **New capability = new vocabulary.** Add a pose, backdrop or action to the engine and `vocab.ts`,
   validate it in the compiler, document it in `docs/SCRIPT_FORMAT.md`, and exercise it in RigTest or a demo episode.
6. **Check before render.** New validations go in `compile.ts` as issues (error = can't render, warning = quality risk).

## Roadmap

- [x] **1. Core engine**: camera, character rig, backdrops, dialogue, subtitles, title cards, 16:9 + 9:16 + thumbnail.
- [x] **2. Script to video**: JSON format, compiler and validator, narration and dialogue modes, voice-over timing.
- [ ] **2b. Voice pipeline**: TTS generation per line, plus word-level timestamps (e.g. Whisper) for exact karaoke subtitles.
- [ ] **3. Libraries**: props (hold/show objects), outfits, more backdrops, charts and diagrams, transitions, particles, parallax.
- [ ] **4. Automated QC**: frame sampling, off-screen/overlap detection in rendered frames, audio-drift checks, repetition and pacing reports.
- [ ] **5. Feedback loop**: use YouTube retention data to tune pacing rules.

## Working with multiple agents

Claude Code is the primary developer. If another agent (e.g. Codex) reviews or optimizes:
- Each agent works on its **own git branch**. Never edit the same files at the same time.
- Read this file first. `CLAUDE.md` and `AGENTS.md` point here.
- Reviews should reference the benchmarks above and rank findings by impact and effort.
