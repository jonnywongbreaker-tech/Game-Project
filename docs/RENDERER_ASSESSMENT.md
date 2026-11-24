# Renderer assessment: custom SVG "Space" vs Three.js

**Status:** recommendation for review (Codex and owner). **No rewrite without approval.**

## What we compared

- **Space (current).** `src/kit/space.ts` and `src/engine/Space.tsx`, about 450 lines. It projects flat polygons on the CPU, sorts them back to front (painter's algorithm), shades each polygon with our stylized look (light bands, cool shadows, warm lights), and emits SVG paths. Characters, text and effects are SVG sprites depth-sorted into the same list.
- **Three.js spike.** `src/spikes/ThreeAtrium.tsx`, about 100 lines, via the official `@remotion/three`. It converts the *same* procedural atrium polygons into one triangle mesh and renders it with toon shading (a 4-step ramp, matching our banding), a shadow-mapped oculus spotlight and fog, using the same camera move.

## Measured (this container: 4-core Xeon, **no GPU**; Three.js runs on software WebGL)

| v3 shot 1, 60 frames, 1080p | Time per frame | Peak memory |
| --- | --- | --- |
| Space (SVG) | **209 ms** | 2.8 GB |
| Three.js (software WebGL, shadow map 2048²) | **324 ms** | **1.9 GB** |

- **Not measured: Three.js on a GPU.** On the Mac mini, run `npx tsx scripts/spike-three.ts 60 angle`. WebGL on Apple GPUs is typically an order of magnitude faster than software rendering, but treat that as an expectation to verify, not a result.
- **Space doesn't speed up on a GPU.** Its cost is CPU geometry work plus SVG rasterisation, about 10–30 ms per 1,000 polygons, and grows with polygon count and blur filters.

## Comparison

| Criterion | Space (SVG, custom) | Three.js (WebGL) |
| --- | --- | --- |
| **Maintenance burden** | Small, but we own every bug. Painter's sorting has already needed manual depth biases twice: the v3 floor drew over a character, and the machine plinth showed through its housing. | Mature library; we maintain only an adapter and materials. Large API surface and version churn. |
| **Performance** | Scales with polygon count on the CPU. About 3,700 polygons is comfortable (v3: 9.5× real time with blur; versatility scenes: 3.8–5.4×). Blur filters are the expensive part. | Scales to millions of triangles with instancing *on a GPU*. Without a GPU (cloud CI, this container) it's slower than SVG. |
| **Lighting** | Our own model: hemisphere, directional, spot and point lights, fog, stylized bands and tints. Easy to art-direct per surface. | Physically based or toon materials, many light types, light maps. Stylization needs custom shaders to match our tints exactly. |
| **Materials** | Matte, metal, glass and water via one shading function; simple and predictable. | Full material system, custom shaders, textures, normal maps. |
| **Shadows** | No real shadows: hand-placed planar projected shadows (a convex hull onto the ground). No shadows onto walls or characters. | Real shadow maps (the spike shows a correct spotlight pool), soft shadows, contact shadows. |
| **Occlusion correctness** | Painter's algorithm: errors with large or intersecting polygons; needs biases. | Per-pixel depth buffer: always correct. Coplanar decals need offsets: the spike's floor inlays z-fight. |
| **Animation** | Everything is a pure function of time; trivially deterministic. | Same (Remotion drives the frame); skinned meshes and morph targets available. |
| **Characters and typography** | First-class: vector characters, crisp at any size, our whole Person system. | 2D characters would become textured planes (an SVG-to-texture step) or full 3D characters (a different art pipeline). Text via overlays is unchanged. |
| **Output quality** | Resolution-independent vector edges; perfectly crisp flat shapes (suits the geometric editorial look). | Rasterised: needs multisampling or supersampling for clean edges; very large frames cost more. |
| **Remotion integration** | Native React/SVG; no special flags. | Official `@remotion/three`; needs a WebGL flag (`--gl=angle` on Mac, `swangle` on servers); a GPU is strongly preferred. |
| **Determinism** | Pixel-identical (tested). | Deterministic per machine and driver; small cross-GPU differences need tolerance in visual tests. |
| **Long-term extensibility** | Every new capability (shadows, occlusion, reflections, instancing) must be built by us. | Huge ecosystem: Blender/glTF import, instancing, post-processing (outlines, ambient occlusion, bloom), physics. |

## Assessment

1. **Space is the right tool for what it does today.** It handles stylized geometric scenes up to about 4–6k polygons with vector characters and typography. It delivered all four versatility scenes and v3, and its output is crisp and fully art-directable.
2. **Its ceiling is visible.** It can't do real shadows, correct occlusion without hand-set biases, or large polygon counts. Those are exactly the things that would let environments get richer, and they're the things Three.js does natively.
3. **The cost of switching is mostly in characters,** not environments. The spike showed environments port with a 40-line adapter, because our generators emit plain polygons. Characters are 2D vector skins drawn from the rig; they'd have to become textured planes in a 3D scene.

## Recommendation

**Don't rewrite.** Prepare a **hybrid** path behind a small interface, and switch only when a measured trigger fires.

- **Keep Space** for characters, props held by characters, typography, callouts and stylized effects.
- **Add an optional Three.js *environment layer***, using the same camera and the same `Poly[]` from our generators, rendered underneath the SVG layer. Characters keep their depth by splitting the environment into a "behind" layer and a "foreground" layer (we already split into depth bands for depth of field).
- **Triggers to adopt the environment layer** (any one):
  1. A scene needs more than about 6k polygons, or render time above 6× real time *on the Mac mini*.
  2. Real cast shadows or ambient occlusion become an art-direction requirement.
  3. We want to import environments modelled in Blender (glTF).
- **Before deciding,** run `scripts/spike-three.ts` on the Mac mini with `angle` to get the GPU number. That single measurement decides the performance side.

## For the reviewer (Codex)

Please challenge:
1. Whether the hybrid's depth splitting (environment behind, characters, environment in front) holds for scenes where characters walk *between* environment objects (the urban crowd does this today).
2. Whether a full 3D character pipeline would be cheaper long-term than vector characters as textured planes.
3. The painter's-algorithm risk in Space for denser scenes. Is a BSP or per-object sort worth adding instead?

Files: `src/spikes/ThreeAtrium.tsx`, `scripts/spike-three.ts`, `src/kit/space.ts`, `src/engine/Space.tsx`.
