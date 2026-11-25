# Asset strategy proposal (for approval)

**Status (2026-11-25):** **approved by the owner with adjustments** (section 7). The pilot
proceeds in stages with an approval stop after the first asset designs. Companion to
`docs/ART_DIRECTION.md` (Vibrant Illustrated Worlds).

**Principle:** we are building an automated animation studio, not an automated illustrator.
The engine assembles, lights, layers and animates approved artwork; it does not care how an
asset was made, only that it follows one contract.

## 1. Three kinds of asset, one contract

| Kind | What it is | Best for | Weakness |
| --- | --- | --- | --- |
| **Procedural SVG** | A code component with parameters (size, seed, colour tokens, state) | Anything that must be accurate, morph, react to data or vary endlessly: diagrams, sky, water, effects, type | Hard to reach rich illustrative craft; every family is design work in code |
| **Designed SVG** (AI-assisted) | A layered SVG file with named parts, designed from an approved AI reference and redrawn as clean vector | Characters, props, modular environment pieces: things that need recolouring, part motion and many reuses | Upfront design and conversion time per family |
| **Illustrated PNG layers** | Transparent painted planes (sky, far, mid, near, foreground) from AI illustration | Rich establishing environments and backdrops where painterly detail beats vector | Fixed artwork: limited part motion and recolouring; consistency and resolution must be managed |

Every asset, whatever its kind, ships with a **manifest** (`asset.json`):

| Field | Purpose |
| --- | --- |
| `id`, `family`, `kind`, `version`, `styleVersion` | Identity; `styleVersion` ties it to the art direction revision it was approved under |
| `size`, `anchor`, `groundLine`, `unitsPerMetre` | How it sits in a scene and scales next to other assets |
| `planes` | For PNG and multi-plane assets: each file with its default depth (parallax) |
| `parts` | For designed SVG: named groups (`head`, `arm.r.upper`, `wheel.front`) with pivots |
| `points` | Named attachment points (`hand.r`, `seat`, `door`, `chimney`) |
| `channels` | What may animate: `sway(pivot, amount)`, `blink`, `spin(part)`, `swap(part, variants)`, `flicker` |
| `colour` | Recolour tokens (designed SVG and procedural) or the colour script it was painted for (PNG) |
| `source` | Provenance: tool, model, prompt, seed, reference images, date, licence notes |
| `qc` | Approval state and checks passed (phone-size silhouette, palette, resolution, edges) |

Storage: a separate local asset library **outside this repository** (section 7), with
stable asset IDs, versioned manifests, relative paths and a library index the director
queries.

## 2. How a scene is assembled (all kinds together)

A scene is a stack of planes, back to front: **sky (0) → far (0.2) → mid (0.45) → stage (1)
→ near (1.15) → foreground (1.35)**, moved by the existing `Camera` + `Layer` parallax. Each
asset declares its default plane; the director can override it.

**What unifies mixed sources:** a per-scene **colour script** applied on top of every
plane, whatever made it:
- a light-direction gradient wash
- haze per depth
- light shafts and glows
- a shared shadow tint
- grain

Bitmaps are colour-matched once at import (baked, not per-frame filters), so the render cost
stays near the measured 0.7–0.8× real time.

## 3. Starter library: asset families and recommendations

| # | Family | Recommended kind | Why |
| --- | --- | --- | --- |
| 1 | **Sky and atmosphere** (gradient skies, sun and moon, clouds, haze, rays, stars) | Procedural SVG | Cheap, recolourable to any colour script, animates naturally (drift, time of day). Already partly built in the valley test. |
| 2 | **Establishing environments** (valley, city, interior rooms, coast, desert) | Illustrated PNG layers | Richest look for the least effort; motion comes from parallax, camera, light and masks. Matches the strength of the OpenArt valley and café references. |
| 3 | **Modular nature** (tree and plant species, rocks, grass and flower clusters) | Designed SVG | Reused in nearly every outdoor shot, needs sway and recolouring, and fills the "detail density" gap cheaply once designed. |
| 4 | **Modular architecture and interiors** (facades, windows, doors, furniture, shelves) | Designed SVG | Recombines into many places; needs attachment points (window, door, seat). |
| 5 | **Characters** (an adult cast built from one design system) | Designed SVG cut-out puppets | Needs part motion (head, arms, hands, blink), outfits and recolouring. Uses simple cut-out animation, not a complex rig. |
| 6 | **Props and vehicles** (cups, phones, cards, books, cars, trams) | Designed SVG | Small, reused, interact with hands; parts such as wheels and doors move. |
| 7 | **Diagrams and scientific visuals** (orbits, axes, charts, cutaways, mechanisms, maps, money flows) | Procedural SVG, always | Accuracy and morphing are the point; AI never supplies technical content (ART_DIRECTION decision 3). |
| 8 | **Effects** (water shimmer, steam, smoke, dust, sparks, glints, glows) | Procedural SVG | Motion is the asset; parameters per scene. |
| 9 | **Textures and overlays** (grain, paper, foliage and surface textures for shapes) | Baked PNG (existing `bake-textures`) | Adds the surface richness vector shapes lack at near-zero cost. |
| 10 | **Type and callouts** (titles, labels, leader lines, captions) | Procedural SVG and text | Must be editable, translatable and mobile-readable. |

### Per family: design, storage, layering, animation, reuse

**1 · Sky and atmosphere (procedural).**
- **Designed:** as presets of the colour script (dawn, noon, dusk, night, overcast).
- **Stored:** as code plus preset JSON.
- **Layer:** plane 0.
- **Animated:** cloud drift, sun travel, ray breathing, twinkle.
- **Reused:** in every exterior, recoloured per niche.

**2 · Establishing environments (PNG layers).**
- **Designed:** from an approved composition template (horizon height, focal zone, empty space for type). Each plane is generated or separated so its silhouette edges are clean; occluded areas are painted in, so parallax never reveals holes.
- **Stored:** 4–6 planes per environment at 2× output width (3840 px), so push-ins stay sharp.
- **Animated:** by camera moves, parallax, light and haze overlays, and masks. Procedural effects can be laid over it (water shimmer, birds-free flying particles, chimney smoke at a named point).
- **Reused:** by re-grading to other colour scripts, recropping, and swapping its foreground plane.

**3 · Modular nature (designed SVG).**
- **Designed:** one design sheet per family (for example 5 trees, 4 rocks, 6 plants) in the house shape grammar, each with internal colour bands (highlight, mid, shadow, rim).
- **Stored:** as SVG with recolour tokens and a sway pivot.
- **Layer:** any plane; scale cues depth.
- **Animated:** sway, rustle (part swap), seasonal recolour.
- **Reused:** scatter rules place them procedurally, so variety needs no new art.

**4 · Architecture and interiors (designed SVG).**
- **Designed:** as modules on a shared grid and scale (`unitsPerMetre`), with named points.
- **Animated:** windows light up, doors open (part swap), signs flicker.
- **Reused:** facades assemble into streets, rooms into interiors.

**5 · Characters (designed SVG cut-outs).**
- **Designed:** one house character design system, with proportions, head construction, hand set and outfit rules. It's developed from AI design sheets (front, three-quarter, profile) and approved once, then redrawn as layered parts with pivots: head (3 views), hair, torso, upper and lower arms, hand poses, legs, shoes.
- **Variation:** procedural (skin, hair, outfit colour, hairstyle and garment swaps), so a cast of many comes from one system.
- **Animated:** pose library (sit, stand, walk cycle, gesture, hold), head turns by view swap, blinks, a breathing offset, props attached to hand points.
- **Not built:** facial lip sync and complex rigs, as agreed.

**6 · Props and vehicles (designed SVG).**
- **Designed:** each prop has a hold point and a contact shadow.
- **Animated:** vehicles have wheel parts; screens and cards show live text (procedural).

**7 · Diagrams (procedural).**
- **Built:** from real geometry and data, styled through the same colour tokens so they sit inside illustrated scenes.
- **Animated:** morphs, draws, growth, highlights.

**8–10 · Effects, textures, type (procedural or baked).** As today, extended per need.

## 4. Consistency, time and cost

| Concern | How it is handled |
| --- | --- |
| **Consistency across AI generations** | One style reference board (approved images) passed as image references with every generation; fixed prompt templates per family; one model per family; recorded seeds; a colour-match pass at import; approval before an asset enters the library. |
| **Consistency between PNG and SVG** | The same colour script, shadow tint, haze and grain applied over every plane; SVG families designed from the same references the PNG plates come from. |
| **Resolution** | The round-4 references are 1376×768, too small for 1080p camera moves. Environment plates need 2K–4K generation or upscaling (an extra credit cost per plane). |
| **Production time (estimate, once per family)** | Sky and effects: hours. A nature or prop family: about half a day (sheet, approval, conversion, QC). The character system: 1–2 days. An environment plate set: about an hour plus generation time. Afterwards, new videos mostly reuse. |
| **Generation cost** | Only design sheets and environment plates use credits. A pilot (section 6) needs roughly 15–30 generations including retries and upscales. Exact credit figures should be checked with OpenArt's cost tool before approval. |
| **Animation flexibility** | Highest for procedural, high for designed SVG (parts and points), lowest for PNG (camera, parallax, light and masks only). This is why characters, props and diagrams are never PNG. |

**Converting AI designs to SVG.** Automatic vector tracing produces tangled paths with no
parts, unusable for animation. The proposal is a manual redraw: Claude Code redraws each
approved design as clean layered SVG from the reference, with tracing only as a guide. This
is the main time cost of designed SVG, and also where the shape sophistication comes from.

## 5. Questions put to the owner (answered in section 7)

1. **Approve the asset kinds per family** (section 3), or move any family between kinds.
2. **PNG storage:** Git LFS in this repository, or a separate assets repository / folder
   synced to the Mac mini. Approved PNG planes for one environment are roughly 10–30 MB.
3. **Pilot budget:** a credit ceiling for the pilot below.
4. **Style references:** which existing images become the first style reference board (the
   OpenArt valley and café references are the proposed seeds).

## 6. Proposed pilot (after approval)

Rebuild the two test scenes with this strategy, to prove the assembly pipeline rather than
the illustration:
- **Valley:**
  - **Environment:** a PNG plate set refined from the OpenArt valley reference.
  - **Sky and effects:** procedural (sky, glints, mist, cabin smoke).
  - **Nature:** one designed-SVG nature family (trees, rocks) for the near planes.
- **Café:**
  - **Room:** a PNG interior plate refined from the OpenArt café reference.
  - **Character:** a first designed-SVG character (one adult, the sip action).
  - **Effects:** procedural (steam, dust, light shaft).

Engine work for the pilot (only after approval): an asset manifest and loader, image planes
in scenes, designed-SVG parts with pivots and recolour tokens, and the colour-script overlay.
No renderer redesign.

## 7. Owner decisions (2026-11-25)

1. **Contract and families approved,** with one change: **characters, architecture and
   interiors may be designed SVG or layered illustrated PNG**, whichever gives the better
   result. Artistic quality is never sacrificed to make an asset procedural.
2. **Storage:** a separate local, reusable asset library outside the engine repository,
   able to serve multiple channels, visual profiles and productions, with stable asset IDs,
   versioned manifests, relative paths and documented backup requirements.
3. **Reference board:** the round-4 OpenArt mountain valley and café images. Keep vibrant
   colour, organic geometry, artistic charm and sophisticated composition; Kurzgesagt stays
   the quality benchmark.
4. **Budget:** at most **1,500 OpenArt credits** for the pilot. Check real model and
   resolution costs first, work in small batches, and stop for approval of the first asset
   designs before expanding the library.
5. **Pilot:** rebuild the valley and café demonstrations with the hybrid workflow,
   prioritising artistic quality, consistent identity, independent layer animation,
   character personality, environmental richness, reuse and efficiency. Implement only
   the essential asset loading, compositing, pivot and animation capabilities; no engine
   redesign.
6. **Validation:** reuse the same approved assets in a second composition with different
   framing, colours and movement. Report real generation cost, manual preparation time,
   development time, render speed, memory and visual limitations. The 0.7–0.8× real-time
   figure is **not** validated for this workflow until measured.
7. **Stop for visual approval** before expanding the library or starting episode production.
