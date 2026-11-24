# Latest benchmark

2026-11-24 22:41 UTC · Intel(R) Xeon(R) Processor @ 2.10GHz · 4 cores · 16.9 GB · linux x64 · concurrency default

| Composition | Resolution | Video | Render | FPS | × real time | 10-min video | Peak memory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Memory-v3-CinematicGeometric-Long | 1920x1080 | 18.0s | 171.2s | 3.2 | 9.51 | 95.1 min | 3816 MB |

Bundle (one-off per render session): 3s.

**Versatility:** castPresets 5 · poses 8 · expressions 7 · backdrops 4 · captionStyles 3 · visualStyles 3 · characterStates 56

**Manual intervention:** Ep001: 19.7 authored beats/min, 2718 bytes of script/min, 0 QC warnings; Ep002: 15.2 authored beats/min, 2728 bytes of script/min, 0 QC warnings. Steps per video: write script → npm run check → npm run render.

**Visual quality:** not machine-scored. Judged by eye against the style benchmarks and protected by `npm run test:visual`.
