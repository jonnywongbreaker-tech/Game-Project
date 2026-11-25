# Why Airplane Windows Are Round

## Preproduction finding

The composed-shot vocabulary at cd7f17e can place opaque solids and draw straight links between visible entities. This episode needs actual openings that expose the background, custom silhouettes for cabin and aircraft views, and curved paths for directional diagrams and qualitative stress illustrations. The reusable additions are an aperture panel, a polygon extrusion, and projected paths laid out in JSON. The renderer and production timeline remain shared.

## Fact check

- A pressurized cabin can have higher air pressure inside than outside at altitude. The resulting pressure difference loads the surrounding structure. Rounded openings ease local stress concentration relative to sharper transitions. A rounded opening still concentrates stress. [Smithsonian National Air and Space Museum](https://howthingsfly.si.edu/ask-an-explainer/why-dont-windows-planes-shatter-due-pressure-difference-inside-and-outside-cabin)
- Opening corners and other local details can influence crack initiation. De Havilland Comet cabin testing used repeated pressure loads and observed cracks around apertures. The Elba investigation identified fatigue evidence around the forward radio antenna window area. Treat this as a lesson in fatigue and structural details. The diagrams are qualitative illustrations, with no computed stress magnitudes or flight counts. [FAA accident case study](https://www.faa.gov/lessons_learned/transport_airplane/accidents/G-ALYV) · [Royal Aircraft Establishment fatigue tests](https://reports.aerade.cranfield.ac.uk/handle/1826.2/3823) · [Court of Inquiry report](https://www.faa.gov/sites/faa.gov/files/2022-10/G-ALYP_Report_0.pdf)
- Changing the window outline is one design measure. Frame reinforcement, fastener detailing and fatigue validation also matter. [NASA research review](https://ntrs.nasa.gov/api/citations/20190002562/downloads/20190002562.pdf) · [FAA accident case study](https://www.faa.gov/lessons_learned/transport_airplane/accidents/G-ALYV)

## Direction

The first shot contrasts sharp and rounded outlines, then adds corner hotspots within the first second. The next shots move from exterior flight to a cabin view, a pressure cross section and a cycle plot. Close framing isolates the sharp corner, then a match in scale and colour returns to the rounded opening. The historical sequence shifts to a test tank and a fastener detail. The episode returns to the cabin and the aircraft silhouette for the conclusion. Blue indicates pressure or a load path, red indicates a hotspot or crack, and amber directs attention.

## Asset reuse

The JSON contains 116 placements across 15 composed shots. There are 57 boxes, 43 outline extrusions, 15 aperture panels and one seeded character. There are 19 distinct geometry or character signatures. Eleven appear in multiple shots and account for 108 placements. A signature uses the asset type and its shape parameters or character seed. Placement, scale and colour can differ. This measures scene-authoring reuse. The repeated cabin and flight sequences also reuse their named subjects and silhouettes.

## Visual quality and production priorities

The opening comparison reads immediately. The cabin return, window scale match and repeated aircraft silhouette support continuity. The cross section, chart, corner close-up, crack trace and exploded frame give separate jobs to the diagrams. The stress paths are qualitative.

This is a coherent technical explainer cut. The voice still sounds synthetic. The flat exterior and sparse cabin have limited depth, and similar full-frame panels recur in the middle. The test tank is a schematic reconstruction. For publication, record or direct a more natural narration performance and complete a sound and mobile editorial review.

1. **Voice, timing and mix.** Import measured timings with recorded narration and support an episode-level audio mix. The current pilot required exact shot holds tuned to one voice and a caption remux. A few cues would benefit from phrase-level timing and shot annotations tied to spoken events.
2. **Reusable scene groups and continuity.** Add nested, parameterized groups for the cabin wall, trim, seat, aircraft silhouettes and test rig. The episode repeats the components as JSON placements. A group would let a director change one shared model and derive intentionally different views.
3. **Diagram validation and preview.** Add safe-area overlays and inspect several timed frames per shot. A midpoint sheet alone missed part of the hook animation. The first render revealed paths crossing the open cutout. The delivered geometry keeps those two traces in the panel.
4. **Depth and transitions.** Add reusable curved cabin sections, layered sky motion, and shot-aware transitions. The current library supports clean technical silhouettes. More dimensional assets would make the cabin and historical shots feel like scenes from one production.

## Cloud benchmark

| Run | Elapsed | Peak process-tree RSS | Pictures rendered | Picture cache hits |
| --- | ---: | ---: | ---: | ---: |
| Cold | 237.75 s | 2.16 GiB | 15 | 0 |
| Warm | 6.02 s | 0.26 GiB | 0 | 15 |

Linux x86-64 with concurrency 2. The benchmark covers picture rendering and episode assembly after voice synthesis. It samples summed process RSS every 200 ms, including Chromium and FFmpeg. Shared pages may be counted by more than one process. Caption muxing and review checks run afterward. The machine-readable result is in `out/production/airplane-master/benchmark.json`.

## Master verification

The final MP4 has 2,700 frames at 1920 × 1080 and 30 fps, 48 kHz mono AAC,
and a selectable English subtitle track. FFmpeg decoded the video and audio
end to end. The final audio matched the source at 45 windows spread across
all 15 narration clips, with zero measured displacement at 8 kHz resolution.
The 23 subtitle cues match the transcript and synthesized word starts.
The embedded cues matched the standalone SRT after newline normalization.
Integrated loudness measured −16.8 LUFS and true peak measured −3.1 dBTP.
The contact sheet samples the midpoint of every shot from the encoded master.
The corrected hook was also inspected between the first second and second five.

Type checking, all 56 unit tests, legacy QC and all 20 Linux visual goldens
passed. The two determinism frames matched byte-for-byte.
