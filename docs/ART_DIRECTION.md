# Art direction: Vibrant Illustrated Worlds

**Status (2026-11-25):** working direction, set by the owner after visual research. Not
final: no artwork, palette or style is locked yet. No engine development resumes until the
owner and Claude Code agree on this document. Earlier explorations are kept below as
history (section 6 and Appendix A).

## 1. Production philosophy

- **Code-first hybrid artwork.** Reusable assets drawn as code (SVG) by default; AI-generated
  artwork only where it clearly improves quality.
- **Near-zero recurring cost.** Local rendering on the Mac mini; paid services (ElevenLabs,
  image generation) are optional inputs, never render dependencies.
- **Reusable, modular libraries:** environments, props, figures and diagram parts, built
  to be split into independently animated layers.
- **Cinematic 2.5D first** (layered parallax, camera moves, masks, reveals, transformations);
  the 3D renderer stays available for technical explanations.
- **Faceless professional narration** (ElevenLabs). No recurring cartoon presenter. Adult
  figures appear only where a scene needs a person.
- **Minimal human intervention**, and one codebase across many educational niches.

Workflow: Script → ElevenLabs narration → Director skill → Artwork and storyboard →
2.5D animation → Sound design → Quality control → Finished video.

## 2. The direction

**Vibrant Illustrated Worlds:** saturated but harmonious colour, soft organic geometry,
visual charm and playfulness for an adult audience, built from simple reusable procedural
parts, with scientifically accurate diagrams and smooth, satisfying motion.

Research (owner, 2026-11): Kurzgesagt, TED-Ed, 3Blue1Brown, LEMMiNO, PolyMatter, The School
of Life, Vox, Veritasium. What we take, as principles, not as a look to copy:

| Source | Principle we adopt |
| --- | --- |
| Kurzgesagt | Vibrant colour scripting, organic geometry, charm, one coherent illustrated universe |
| LEMMiNO | Atmospheric depth and cinematic restraint: calm camera, darkness and haze used to focus |
| 3Blue1Brown | Satisfying geometric transformations; diagrams that are exact, not decorative |
| TED-Ed | Artistic composition and visual imagination: an idea per shot, told through a metaphor |

### Visual rules

| Area | Rule |
| --- | --- |
| Colour | Each scene has a **colour script**: 3 dominant saturated hues plus 1–2 accents, chosen for harmony (related hues, controlled lightness steps), not a fixed brand palette. Shadows are **coloured** (hue-shifted toward blue or violet, never grey); light is warm or tinted. Keep a clear **value structure** (dark, mid, light) under the saturation so shapes and text still read in greyscale. The muted navy, teal and beige palette is retired. |
| Gradients | Smooth, purposeful gradients inside crisp silhouettes: one gradient plus at most a rim highlight and a soft inner shadow per shape. No banding, no rainbow fills. |
| Shapes | Soft, organic geometry: consistent rounded corners, gentle curves, simple primitives assembled into charming forms. Silhouettes first, detail second. Avoid toy-like capsule forms everywhere; vary the shape vocabulary per object family. |
| Detail | Selective: detail clusters around the focal point; backgrounds simplify with distance. No decorative filler (random blocks, sparkles, stars) unless it means something. |
| Light and glow | Light sources may glow; nothing else does. Glow is a soft radial gradient, never neon edges. Haze and darkness create depth (LEMMiNO), used with restraint. |
| Characters | Adults with believable proportions, simplified and stylised (faceless or minimal faces are fine), with personality through pose and silhouette. Never childlike, never generic stock figures, no recurring mascot. |
| Diagrams | **Scientifically accurate, drawn by code from real geometry** (orbits, angles, mechanisms, data). AI images are never the source of a diagram. Transformations (morph, grow, rotate, unfold) are the explanation (3Blue1Brown). |
| Composition | One idea per shot, a clear focal point, rule of thirds, negative space for type. Three readable depth planes. Playful, imaginative metaphors are welcome (TED-Ed). |
| Motion | Smooth easing, gentle continuous camera drift, overlapping secondary motion (floating, breathing, flowing), satisfying transitions between scales and states. |
| Type | Clean, legible sans for labels and captions, an expressive display face for titles; mobile-readable (captions at least 4.5% of frame height, WCAG AA contrast). |
| Avoid | Excessive neon glow, generic characters, unnecessary decoration, inaccurate mechanics, oversized cartoon heads, cylinder limbs, cheap low-poly geometry, PowerPoint layouts, clutter. |

### Originality guardrails

Kurzgesagt's look is distinctive and well known; we aim for comparable appeal with our own
identity, not imitation. We do not use their recurring characters or creature designs (for
example their birds), their typefaces, their signature palettes or their iconic motifs. Our
identity should come from:

- **Our own shape grammar:** a defined corner radius scale, curve style and construction
  rules applied to every asset family.
- **Our own colour logic:** documented per-niche colour scripts with coloured shadows,
  rather than one borrowed palette.
- **A recurring signature motif** that belongs to the channel (a candidate from earlier work:
  ideas as warm points of light joined by threads, from the memory-network prototypes).
- **Our own typography pairing**, chosen and licensed for the channel.

## 3. Assessment: reaching this appeal with the existing engine

What gives Kurzgesagt-level appeal is mostly **craft and system**, not exotic technology:
a disciplined colour script, a consistent shape grammar, layered depth, constant gentle motion,
and transitions that explain. All of it is cheap to render as SVG.

| Ingredient | Existing engine | Gap (new capability, small unless noted) |
| --- | --- | --- |
| Saturated gradients, coloured shadows | SVG linear and radial gradients in theme `Defs`; blend modes (screen, multiply, overlay); the CGE look already shifts shadows toward blue and light toward warm (`themes/cge/identity.ts`) | A 2D **shading recipe** (base gradient, coloured shadow shape, rim highlight) shared by all assets, driven by the scene's colour script |
| Harmonious per-scene palettes | Palettes are hard-coded per theme | A **colour-script module**: generate and validate harmonious palettes (hue relationships, lightness steps, greyscale value check) from a few inputs |
| Soft organic geometry | Shape helpers in `themes/draw.ts`; geometry kits produce shapes from code | An **organic shape kit**: rounded and superellipse primitives, smooth blobs, tapered strokes, with the shared corner-radius scale |
| Layered depth and parallax | `Camera` + `Layer` with per-depth parallax and filters (v2, working) | Exposure in production JSON (the `layers` template assessed earlier) |
| Atmospheric depth (haze, darkness) | Per-layer tints and filters, gradient overlays, grain (`TextureOverlay`) | Haze and vignette as colour-script settings rather than theme code |
| Glow on light sources | Radial-gradient glows (cheap); bloom via blur filters (expensive) | A rule: glows are pre-built radial gradients, no live blur, to keep render cost near style A (~0.3× real time) instead of style C (~5×) |
| Constant gentle motion | Easing and tween helpers, seeded noise, particle and mote logic, network growth and pulses | Reusable "ambient motion" behaviours (float, sway, drift, twinkle, flow) applicable to any asset |
| Satisfying transformations | Network growth, tweened transforms | **Shape morphing** (path interpolation between shapes) and scale-to-scale zoom transitions, the core 3Blue1Brown-style tool. Medium effort, the most valuable addition. |
| Accurate diagrams | Network kit, paths, links, annotations, mechanics kit (gears, crank-slider) | A small diagram library (orbits, axes, charts, mechanisms) in the new shape and colour system |
| Characters | Person v2 (adult proportions, SVG, front/profile/back) but in the muted look | Restyle with the new shape grammar and colour script; no new rig |
| AI artwork | Not usable as scene layers yet | Optional image layers; best used for **colour scripts, mood and composition references**, then rebuilt in code. AI backgrounds only where code cannot reach the quality. |
| Narration, timing, mixing, QC, caching | Production CLI (existing) | None for the look itself |

**Render cost.** Gradients, shapes and parallax are cheap: the existing SVG path renders
style A at about 0.3× real time on the Mac mini. The style stays near that as long as glows
are gradients, not blur filters.

**Human intervention.** Highest at the start (designing the shape grammar, colour logic and
first asset families), then low: new videos reuse assets and colour scripts, and the
director chooses rather than draws.

**How to judge it before building.** Rebuild two of the round-4 references in code with the
criticisms fixed (for example the mountain valley and the café figure). That shows whether
code-drawn SVG reaches the target appeal, at what render cost, before any wider work.

## 4. Research record (2026-11-25, OpenArt, Nano Banana Pro, 1376×768)

All images are exploratory and stored outside git (`out/refs/openart-all/`).

| Round | What was tried | What it showed |
| --- | --- | --- |
| 1 · D / E / F urban street | Premium geometric editorial, cinematic illustrated matte painting, isometric diorama, from the Appendix A prompts | High craft in all three (E strongest, F charming), but a muted retro palette and a serious period mood: low visual energy. |
| 2 · Navy palette science diagrams | Flat vector Earth, Sun, axial tilt, seasons, orbit, on deep navy with turquoise, yellow, coral, lavender | Closest to a science-explainer feel, but **diagrams were inaccurate**: two overlapping suns, an axis drawn as an X, double-headed sunlight arrows, text baked in ("SUMMER", "WINTER") despite instructions. Confirms diagrams must be drawn by code. |
| 3 · Four style blocks on two subjects (café adult, Earth and Sun) | Atmospheric geometric, artisan editorial, luminous geometry, soft dimensional, in ink blue, teal, amber, ivory | Elegant and adult; Earth and Sun accurate when simple. Still restrained, moody and low-energy; luminous geometry the most distinctive. |
| 4 · Vibrant geometric | Saturated warm-cool palettes, coloured shadows, gradients in crisp silhouettes: café adult, Earth and Sun, mountain valley, engine | Energy and appeal the owner wants. Problems: neon glow and sparkle stars (Earth), generic figure and purposeless background blocks (café), toy-like capsule trees (valley), an unreadable, inaccurate engine. Basis of the current direction. |

## 5. Decisions so far

1. Muted editorial palettes (navy, teal, beige) are retired (owner, after rounds 1–3).
2. High saturation is intentional; harmony, value structure and restraint in glow keep it adult.
3. Diagrams and mechanisms are drawn by code from accurate geometry; AI images do not
   supply technical content.
4. The engine serves the art direction; no engine work until this document is agreed.

## 6. History

- **v1 to v3 (2026-11-24):** styles A (geometric), B (textured), C (cinematic 2.5D), then the
  approved "A+C" Cinematic Geometric Editorial, built in 3D as v3. See PROJECT.md section 3.
- **Phase 4.2 proposal (2026-11-25):** directions D, E and F with 15 reference prompts.
  Superseded by this document; kept as Appendix A.

## Appendix A: Superseded D / E / F proposal (2026-11-25, kept for record)

### 1. Production philosophy (confirmed)

- **Code-first hybrid artwork.** Reusable assets drawn as code (SVG) by default; AI-generated
  artwork only where it clearly beats code (rich environments, painterly light).
- **Near-zero recurring cost.** Local rendering on the Mac mini; paid services (ElevenLabs,
  image generation) are optional inputs, never render dependencies.
- **Reusable, modular libraries:** environments, props, figures, diagram parts, all built
  to be split into independently animated layers.
- **Cinematic 2.5D first** (layered parallax, camera moves, masks and reveals); the 3D
  renderer stays available for technical explanations.
- **Faceless, professional narration** (ElevenLabs). No recurring cartoon presenter. Adult,
  illustrated characters appear only where a scene needs a person.
- **Minimal human intervention**, and one codebase for many educational niches.

### 2. Shared art rules (apply to every style)

| Area | Rule |
| --- | --- |
| Audience | Adults. Proportions 7–8 heads tall, natural hands, tapered limbs, no oversized heads or eyes, no "mascot" faces. Faces simplified, never cute. |
| Composition | One clear subject per frame; rule of thirds; a deliberate negative-space zone (usually the upper or left third) that can take a title or callout; three readable depth planes. |
| Light | One motivated key light per scene; shadows carry form. Glow and blur only where they tell the viewer where to look. |
| Colour | A restrained base palette per style (5–6 colours) plus a single accent used for "the thing that matters" in each shot. |
| Texture | Subtle: fine grain or paper tooth at low strength, never pattern noise that fights text. |
| Type | Serif display for statements (Caladea, bundled), sans for labels and captions (Inter, bundled). Captions at least 4.5% of frame height; WCAG AA contrast against their scrim. |
| Readability | Test every key frame at phone size (about 360 px wide): subject, silhouette and text must still read. |
| Layering | Foreground, midground and background never fuse: each plane has a clean silhouette edge so it can be cut out and moved. No text or logos baked into artwork. |
| Avoid | Cartoon heads, childlike characters, cylinder limbs, generic corporate vector ("Memphis") art, low-poly game geometry, heavy bloom and blur, repeated identical buildings or trees, slide-deck layouts, clutter. |

### 3. The three directions

**D: Premium Geometric Editorial.** Magazine-grade editorial illustration: precise
geometric construction, flat planes with subtle gradients and soft shadow shapes, fine paper
grain, restrained palette (deep ink navy, warm off-white, muted teal, sand, one vermilion
accent). Closest to the existing engine; distinctive if the drawing is sophisticated, generic
if it is not.

**E: Cinematic Illustrated 2.5D.** Illustrated matte-painting look: painterly but
shape-defined environments, directional golden or cool light, atmospheric perspective,
strong separation of planes, subtle film grain and a teal-amber grade. The most "premium
documentary" feel and the best fit for AI-generated environments.

**F: Stylized Isometric Diorama.** Miniature modular worlds in true isometric projection on
a cut ground slab: detailed architecture, bevelled forms, matte materials, soft contact
shadows. Excellent for systems and processes (how money moves, how an engine works), less
emotional for human stories.

### 4. Reference prompts (15 images)

Each prompt is self-contained: a shared **composition** block (identical across styles, so
the comparison is about art, not scene choice) plus a **style** block and a **negative**
line. All images are 16:9 (1920×1080 or the tool's nearest). Prompts are model-agnostic;
where a tool has a separate negative field, paste the negative line there.

#### Style blocks

- **D:** premium geometric editorial illustration, sophisticated magazine art direction,
  precise geometric construction, mature adult proportions (7.5 heads tall), clean
  silhouettes, flat planes with subtle gradients and soft shadow shapes, restrained palette
  of deep ink navy, warm off-white, muted teal, sand and a single vermilion accent, fine
  paper grain, crisp edges, generous negative space, no outlines.
  *Negative:* cartoon, oversized heads, childlike, corporate Memphis, generic flat vector
  stock art, isometric, 3D render, glossy, heavy gradients, text, logos, watermark.
- **E:** cinematic illustrated matte painting, painterly digital illustration with clearly
  defined shapes, directional key light with cool shadows, atmospheric perspective and haze,
  distinct foreground, midground and background planes, subtle film grain, restrained
  teal and amber colour grade, cinematic widescreen composition, mature realistic
  proportions.
  *Negative:* children's book, storybook, anime, chibi, photorealistic photo, heavy bloom,
  lens flare, excessive blur, oversaturated, text, logos, watermark.
- **F:** stylized isometric diorama illustration, true isometric projection at 30 degrees,
  detailed miniature modular environment on a clean cut ground slab, refined architectural
  forms with subtle bevels, matte materials, soft ambient-occlusion contact shadows,
  restrained sophisticated palette, technical illustration clarity, consistent scale and
  proportions, plain soft background.
  *Negative:* low-poly, video game, voxel, toy plastic, tilt-shift blur, cartoon, clutter,
  text, logos, watermark.

#### Composition blocks

1. **Urban street.** A mid-rise city street in late-afternoon light, seen from slightly
   above eye level at a three-quarter angle, buildings on both sides receding toward a
   vanishing point right of centre; a tram in the midground, two cars, eight to ten adult
   pedestrians of varied ages on the sidewalks; a lamp post and a partial pedestrian
   silhouette framing the left foreground; varied facades, shopfronts and awnings, no two
   buildings alike; calm open sky in the upper left third.
2. **Office.** An adult in their forties sitting at a desk in a modern office, three-quarter
   side view, working on a laptop, natural relaxed posture; a large window behind with a
   soft city view, a plant, a shelf with a few books; the person occupies the right third,
   the left third is calm wall or window space.
3. **Engine cutaway.** An inline four-cylinder car engine in three-quarter view with a
   cutaway section exposing pistons, connecting rods, crankshaft, valves, camshaft and
   timing belt; components clearly separated and readable; neutral studio backdrop with
   soft floor shadow; open space around the engine for labels.
4. **Mountain landscape.** A valley at early morning: a river winding through pine forest
   in the foreground, layered ridges receding into haze, distant snow-capped peaks, light
   breaking from the right; strong separation between foreground trees, mid ridges and
   far peaks; open sky in the upper third.
5. **Banking transaction.** The journey of a card payment, left to right: an adult tapping
   a card on a payment terminal at a café counter (left), a glowing path carrying the
   payment through a payment network hub (centre), arriving at a bank building or vault
   (right); simple directional flow markers along the path, clear sequence, uncluttered.

#### Full prompts

Assemble each as: `[composition] — [style block]. 16:9.` plus the style's negative line.
D prompts are written out in full. In E rows, replace the bracketed note with the matching
composition block above. F rows carry their diorama adaptation in brackets; paste that text
as the composition.

| # | Prompt |
| --- | --- |
| D1 | A mid-rise city street in late-afternoon light, seen from slightly above eye level at a three-quarter angle, buildings on both sides receding toward a vanishing point right of centre; a tram in the midground, two cars, eight to ten adult pedestrians of varied ages on the sidewalks; a lamp post and a partial pedestrian silhouette framing the left foreground; varied facades, shopfronts and awnings, no two buildings alike; calm open sky in the upper left third. Premium geometric editorial illustration, sophisticated magazine art direction, precise geometric construction, mature adult proportions, clean silhouettes, flat planes with subtle gradients and soft shadow shapes, restrained palette of deep ink navy, warm off-white, muted teal, sand and a single vermilion accent, fine paper grain, crisp edges, no outlines. 16:9. |
| E1 | (Urban composition as D1.) Cinematic illustrated matte painting, painterly digital illustration with clearly defined shapes, low golden late-afternoon sun raking down the street with cool blue shadows, atmospheric haze deepening with distance, distinct foreground, midground and background planes, subtle film grain, restrained teal and amber grade, cinematic widescreen composition, mature realistic proportions. 16:9. |
| F1 | (Urban composition adapted to a diorama: one city block section with the street, tram, cars and pedestrians, buildings on both sides, cut cleanly at the block edges.) Stylized isometric diorama illustration, true isometric projection, detailed miniature modular environment on a clean cut ground slab, refined architectural forms with subtle bevels, matte materials, soft contact shadows, restrained sophisticated palette, technical illustration clarity, plain soft background. 16:9. |
| D2 | An adult in their forties sitting at a desk in a modern office, three-quarter side view, working on a laptop, natural relaxed posture; a large window behind with a soft city view, a plant, a shelf with a few books; the person occupies the right third, the left third is calm wall space. Premium geometric editorial illustration, sophisticated magazine art direction, mature adult proportions (7.5 heads tall), natural hands, clean silhouettes, flat planes with subtle gradients and soft shadow shapes, restrained palette of deep ink navy, warm off-white, muted teal, sand and a single vermilion accent, fine paper grain, no outlines. 16:9. |
| E2 | (Office composition as D2.) Cinematic illustrated matte painting, painterly digital illustration with clearly defined shapes, soft daylight from the window as key light with warm desk-lamp fill, gentle depth haze toward the window, distinct foreground desk, midground figure and background city, subtle film grain, restrained teal and amber grade, mature realistic proportions. 16:9. |
| F2 | (Office composition as a diorama: a single office room cut away on two sides, the adult seated at the desk by the window, plant and shelf.) Stylized isometric diorama illustration, true isometric projection, miniature modular room on a clean cut floor slab, refined furniture with subtle bevels, matte materials, soft contact shadows, mature figure proportions, restrained sophisticated palette, plain soft background. 16:9. |
| D3 | An inline four-cylinder car engine in three-quarter view with a cutaway section exposing pistons, connecting rods, crankshaft, valves, camshaft and timing belt; components clearly separated and readable; neutral backdrop with soft floor shadow; open space for labels. Premium geometric editorial illustration, precise geometric construction, technical clarity, flat planes with subtle gradients and soft shadow shapes, cut surfaces in a single vermilion accent, restrained palette of deep ink navy, warm off-white, muted teal, sand and steel grey, fine paper grain, crisp edges, no outlines. 16:9. |
| E3 | (Engine composition as D3.) Cinematic illustrated technical painting, painterly digital illustration with clearly defined mechanical shapes, a single directional key light with cool rim light on steel, subtle workshop atmosphere, cut surfaces in a warm accent, subtle film grain, restrained teal and amber grade, cinematic composition. 16:9. |
| F3 | (Engine composition as an isometric exploded-cutaway on a display plinth.) Stylized isometric technical diorama, true isometric projection, precise mechanical components with subtle bevels, matte painted metal, cut surfaces in a single warm accent, soft contact shadows, technical illustration clarity, plain soft background. 16:9. |
| D4 | A valley at early morning: a river winding through pine forest in the foreground, layered ridges receding into haze, distant snow-capped peaks, light from the right; strong separation between foreground trees, mid ridges and far peaks; open sky in the upper third. Premium geometric editorial illustration, precise geometric construction of trees and ridges, flat planes with subtle gradients and soft shadow shapes, aerial perspective by value steps, restrained palette of deep ink navy, muted teal, sand, warm off-white and a single vermilion sunrise accent, fine paper grain, no outlines. 16:9. |
| E4 | (Landscape composition as D4.) Cinematic illustrated matte painting, painterly digital illustration with clearly defined shapes, low morning sun breaking from the right, layered atmospheric haze between ridges, distinct foreground forest, midground ridges and far peaks, subtle film grain, restrained teal and amber grade, cinematic widescreen composition. 16:9. |
| F4 | (Landscape composition as a diorama: a terrain block with the river valley, pine forest and one mountain peak, the ground cut cleanly to show soil and rock layers.) Stylized isometric diorama illustration, true isometric projection, refined terrain with subtle bevels, matte materials, soft contact shadows, restrained natural palette, technical illustration clarity, plain soft background. 16:9. |
| D5 | The journey of a card payment, left to right: an adult tapping a card on a payment terminal at a café counter (left), a path carrying the payment through a payment network hub (centre), arriving at a bank building (right); simple directional flow markers along the path, clear sequence, uncluttered. Premium geometric editorial illustration, precise geometric construction, mature adult proportions, clean silhouettes, flat planes with subtle gradients and soft shadow shapes, the payment path in a single vermilion accent, restrained palette of deep ink navy, warm off-white, muted teal and sand, fine paper grain, generous negative space, no outlines. 16:9. |
| E5 | (Banking composition as D5.) Cinematic illustrated painting, painterly digital illustration with clearly defined shapes, the café warmly lit on the left, the network hub in cool blue light at centre, the bank in dusk light on the right, the payment path as a thin warm light trail, atmospheric depth, subtle film grain, restrained teal and amber grade, mature realistic proportions. 16:9. |
| F5 | (Banking composition as three connected isometric dioramas: café counter with terminal, payment network building, bank, joined by a raised path with flow markers.) Stylized isometric diorama illustration, true isometric projection, miniature modular buildings with subtle bevels, matte materials, soft contact shadows, the payment path in a single warm accent, mature figure proportions, restrained sophisticated palette, technical illustration clarity, plain soft background. 16:9. |

**Review tips.** Generate two or three seeds per prompt and keep the best one, so the
comparison is between styles, not lucky seeds. Note which images needed the most retries:
that is an early signal of production cost.

### 5. Feasibility assessment

Ratings: ●●● strong, ●● moderate, ● weak. "Engine today" means the existing code with no
new capabilities.

| Criterion | D · Premium Geometric Editorial | E · Cinematic Illustrated 2.5D | F · Isometric Diorama |
| --- | --- | --- | --- |
| Visual quality ceiling | ●● Excellent if drawing is sophisticated; drops fast toward generic vector | ●●● Highest; reads as premium documentary | ●●● Very high for systems; weaker for emotion and people |
| Distinctiveness on YouTube | ●● Crowded genre; needs a strong signature (palette, light, type) | ●●● Rare among faceless explainers at this polish | ●● Recognizable, but a known "explainer diorama" look |
| Range across niches | ●●● Anything: finance, science, history, health | ●●● Strongest for history, nature, places, stories; fine for others | ●● Best for tech, cities, processes; awkward for abstract or emotional topics |
| Code-generated SVG | ●●● Natural fit; existing themes A and cge already draw this way | ● Painterly texture and light are hard to code convincingly | ●●● Isometric is pure 2D geometry; modular tiles suit code well |
| AI-generated artwork | ●● Image models drift in proportion and line; consistency is hard | ●●● Image models excel here; style references keep it consistent | ●● Good single images, but exact isometric angle and modularity drift |
| Asset reusability | ●●● Parametric shapes, recolourable | ●● Backgrounds reused by re-grading and recropping; less modular | ●●● Tiles, buildings and props recombine endlessly |
| Animation flexibility | ●●● Every shape is a separate object | ●● Parallax of layers, light, camera; per-object motion needs cut-outs | ●● Objects move along grid axes; camera mostly pans and zooms |
| Render cost (Mac mini, estimate) | ~0.3–1× real time (comparable to style A, measured 0.3×) | ~0.3–1× real time with images and pre-baked blur; up to ~5× with live SVG blur (style C, measured) | ~0.5–1× real time as SVG; cheaper if pre-rendered |
| Human time per video (estimate) | Low once the library exists | Medium: curate AI images, separate layers, fix artifacts | Low to medium once the tile library exists |
| Long-term scalability | ●●● Library grows by code | ●● Depends on AI consistency and layer separation tooling | ●●● Library grows by tiles; strong for series |

#### What the existing engine covers today vs. what is new

| Need | Engine today | New capability needed |
| --- | --- | --- |
| Draw D-style vector scenes | Yes: SVG themes, palettes, gradients, grain (styles A, cge) | Mature figure set (Person v2 is close; needs proportion review, not a new rig) |
| Draw F-style isometric scenes | Partly: SVG drawing; the 3D renderer could render isometric with a narrow-angle camera, but its low-poly look conflicts with the brief | An isometric SVG tile kit (projection helpers, tile and building library) |
| Use E-style or any AI artwork | No: only tiled texture overlays use bitmaps | Image layers (PNG and SVG files placed, scaled and animated) in production JSON |
| Foreground / midground / background parallax | Yes in code (`Camera` + `Layer`, v2) | Exposure through production JSON |
| Camera moves | Yes: pan, zoom, roll (2D); full shot grammar (3D) | Named 2D moves (push-in, reveal) through JSON |
| Masks and reveals | Clip paths only | General masks and animated reveals |
| Animated diagrams and callouts | Partly: paths, links, labels, flow cards, network kit | A small diagram library (charts, timelines, labelled cutaways) |
| Grain, light, grade, atmosphere | Yes: grain overlays, blend modes, glows, grade layers (style C) | Exposure as style-profile settings |
| Narration, timing, mix, QC, caching | Yes (production CLI) | None for this phase |

#### Observations for the review

- **The three can coexist** under one identity (shared palette, type and light rules):
  E for establishing shots and atmosphere, D for people and explanation, F for systems and
  processes. That costs more art direction but matches "one engine, many niches". It is an
  option to judge from the images, not a recommendation to adopt.
- **E depends most on AI artwork**, so its feasibility hinges on how consistent the
  reference images are across subjects and seeds, and on how cleanly they separate into
  layers.
- **D and F can be produced entirely in code** with near-zero cost, but only reach the
  target quality with a serious, one-time asset design effort.
