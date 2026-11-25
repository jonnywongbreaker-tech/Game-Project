# Phase 4 handoff

Baseline `1d54fb0` is the original 90-second airplane-window pilot. Its episode JSON and exported benchmark master are preserved. This phase renders only short approval samples.

## Review the styles

The three 12-second samples use the same three shots and nested cabin from `sequence.json`. The camera angles cover a wide cabin view, window detail, and an oblique explanation. The original pilot excerpt in the four-up comparison is a reference cut. The three new clips provide the controlled style comparison.

| Profile | Visual direction | Cold | Warm | Cold peak process RSS |
| --- | --- | ---: | ---: | ---: |
| Editorial | Ivory paper, dark ink, minimal depth, serif titles, cuts | 43.06 s | 1.55 s | 1.75 GiB |
| Cinematic | Dark cobalt, warm key light, metallic depth, fades | 43.67 s | 1.76 s | 2.24 GiB |
| Illustrated | Soft colour blocks, heavier strokes, sans hierarchy, short wipes | 43.31 s | 1.75 s | 2.26 GiB |

All three are 1920 × 1080 at 30 fps. Benchmarks used Linux Cloud with two workers and reused all three pictures on warm runs. The Apple Silicon benchmark remains a separate verification. Style approval remains open.

```sh
npm ci
npm run --silent production -- capabilities
for style in editorial cinematic illustrated; do
  npm run production -- assemble examples/phase4/sequence.json --style "$style" --out "out/production/phase4-$style"
  npm run production -- qc examples/phase4/sequence.json --style "$style" --samples 5
done
npm run production -- contact examples/phase4/sequence.json --style cinematic --samples 3 --out out/production/phase4-review
```

Use episode `style` as a preset name or as an object with `profile` and override fields. Explicit scene colours, lighting, labels and ease values take precedence over the profile. Entity `tone` selects a palette role. Scene `groups` instantiate reusable definitions in episode `library`. Groups compose position, yaw and uniform scale. IDs derive from the instance path. `variant` applies configured member overrides, while `dressing:false` drops optional dressing throughout the instance. The renderer prepares meshes per shot and the director reuses the same authored geometry at each angle.

## Audio workflow

The checked-in `audio.json` and local stems reproduce the demonstration. The audio demo uses the cinematic visuals as a convenient comparison surface. Style approval applies separately. The demo uses local Piper LJ Speech narration, an original generated music bed, and cue effects. It includes narration lead and tail pauses, the pronunciation override from “cutout” to “cut out,” word alignment, normalization, and ducking. [LJ Speech dataset](https://keithito.com/LJ-Speech-Dataset/) · [Piper model card](https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/ljspeech/medium/MODEL_CARD)

```sh
npm run production -- assemble examples/phase4/audio.json --require-alignment --out out/production/phase4-audio
npm run --silent production -- narration examples/phase4/audio.json > out/phase4-narration-requests.json
```

For a new narrator, change the catalog voice or provider, generate local media from the request’s spoken text, and import the WAV and SHA-bound timing sidecar. The caption transcript preserves the display spelling. A local optional aligner accepts external US-English narration. The demo was aligned using PocketSphinx 5.0.4. Install it separately in a virtual environment, then run:

```sh
python3 scripts/align-narration.py examples/phase4/audio.json out/phase4-narration-requests.json
```

PocketSphinx is dictionary-based and expects words or pronunciation aliases it recognizes. Review alignments for new voices and technical terms. Narration normalization is single-pass. The output uses a sample limiter and mono AAC. Pauses currently use shot lead and tail time and the provider’s punctuation. Transitions are picture fades or wipes to the profile background inside the shot boundaries.

## QC and remaining work

The QC reports sample 19 frames per style, with authored action and camera boundaries included. Frame-edge and near-plane measurements, diagram segment intersections and large frame-to-frame movement are reproducible flags. Projected overlaps and text overflow estimates require review. Aperture shells, wall crops, and framing close-ups generate intentional bounds alerts. Actual layer occlusion, font shaping, mobile legibility and editorial pacing still need visual review. The contact sheet captures three frames per shot, including transition endpoints.

The visual samples establish distinct palettes and hierarchy. The cabin still reads as a constructed set in the widest angles, and the tighter editorial composition crops part of the guide. For production, prioritize style approval, targeted framing and curved cabin detailing, then a measured audio pass on the Apple Silicon target. Keep longer episodes behind the style approval gate.

## Regression and handoff

Type checking, 60 unit tests, legacy QC and all 20 visual regression plates passed. Determinism stills matched byte-for-byte. The Git bundle carries the Phase 4 source, demo JSON, and audio inputs. The review pack carries the rendered comparison, clips, audio demo, QC, contact sheet, benchmarks and bundle.
