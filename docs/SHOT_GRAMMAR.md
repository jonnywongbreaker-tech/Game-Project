# Semantic shot grammar

**Goal:** the director (an LLM, or a person writing a storyboard) asks for shots by
*intent*. It never writes camera coordinates. The engine turns intent plus scene
knowledge into camera paths.

```jsonc
// What the director writes (storyboard IR)
{"shot": "establishing", "subject": "street", "duration": 2.6}
{"shot": "tracking", "subject": "tram", "mode": "chase", "duration": 2.4}
{"shot": "closeUp", "subject": "cube", "duration": 1.5}
{"shot": "scaleTransition", "from": "cube", "to": "tower", "duration": 3.5}
```

## How it resolves

1. **The scene registers its subjects.** Each scene exposes named subjects:
   - `pos`: what to frame.
   - `size`: characteristic size in metres.
   - `facing`: optional.
   - `follow(t)`: optional, for anything that moves.
2. **Each grammar function computes the camera path.** The functions live in `src/kit/shotGrammar.ts`. Each one derives distances from the subject's size and the lens (`frameDistance`), picks angles from the subject's facing, and outputs `Shot` keyframes for the sequencer (`src/kit/shots.ts`).
3. **The renderer plays the shots.** Cuts, focus and depth of field come from the shot.

## Shot types (implemented)

| Type | Intent | Key parameters (all optional, with defaults) |
| --- | --- | --- |
| `establishing` | Orient the viewer in a place; slow push | `azimuth`, `elevation`, `fov`, `push` |
| `closeUp` | Intimacy or detail on a subject; three-quarter angle, shallow depth of field | `fraction` (how much of the frame), `angle`, `elevation`, `blur` |
| `objectReveal` | Show an object's form by orbiting it | `orbit` (degrees), `startAzimuth`, `elevation` |
| `tracking` | Follow something moving, with lead room | `mode`: `side` or `chase`; `distance`, `lead`, `elevation` |
| `cutaway` | Insert shot of a detail (e.g. inside a machine); straight-on, slow slide | `normal` (face to look at), `slide` |
| `scaleTransition` | Dramatic change of scale, from something small to something vast | `from`, `to`, `fromFov`, `toFov`, `elevation` (negative = look up) |

The four versatility scenes (`src/prototypes/versatility/*`) use only these
functions. No camera coordinates are hand-keyed.

## What the benchmark taught us

- **Cameras inside geometry.** In the first urban pass, `establishing` 16° off the street axis and `tracking` with a 24 m side offset both put the camera inside buildings. Each was fixed by choosing parameters, but an automated director needs **camera collision avoidance**: a check against scene bounds or occupancy, then pulling the camera along its view line until it's clear. This is the next grammar feature.
- **Things blocking the subject.** A tree canopy passed between the camera and the tram. Needed: a **line-of-sight check** to the subject; if blocked, shift the azimuth.
- **Shots that end on the wrong thing.** The first `scaleTransition` ended level with the tower's middle and lost the person. The fix was a "look up" elevation. Rule of thumb for the director: a scale transition should end with the *small* subject still in frame.

## Next steps

1. Subject registry per scene (names → `Subject`) and storyboard IR → `Shot[]` resolution.
2. Collision and occlusion checks with automatic correction (QC reports what it changed).
3. Composition rules: subject on thirds, headroom, lead room, and a text-safe side that matches where titles are placed.
4. More types: `overTheShoulder`, `insert`, `whipPan`, `dollyZoom`, `rackFocus`.
