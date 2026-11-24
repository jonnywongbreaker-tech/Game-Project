# Latest benchmark

2026-11-24 22:21 UTC · Intel(R) Xeon(R) Processor @ 2.10GHz · 4 cores · 16.9 GB · linux x64 · concurrency default

| Composition | Resolution | Video | Render | FPS | × real time | 10-min video | Peak memory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Memory-A-Geometric-Long | 1920x1080 | 15.0s | 35s | 12.9 | 2.33 | 23.3 min | 2222 MB |
| Memory-B-Textured-Long | 1920x1080 | 15.0s | 105.2s | 4.3 | 7.01 | 70.1 min | 2728 MB |
| Memory-C-Cinematic-Long | 1920x1080 | 15.0s | 206.5s | 2.2 | 13.77 | 137.7 min | 3587 MB |
| Ep001-Long | 1920x1080 | 42.8s | 68.6s | 18.7 | 1.61 | 16.1 min | 1827 MB |

Bundle (one-off per render session): 3.2s.

**Versatility:** castPresets 5 · poses 8 · expressions 7 · backdrops 4 · captionStyles 3 · visualStyles 3 · characterStates 56

**Manual intervention:** Ep001: 19.7 authored beats/min, 2718 bytes of script/min, 0 QC warnings; Ep002: 15.2 authored beats/min, 2728 bytes of script/min, 0 QC warnings. Steps per video: write script → npm run check → npm run render.

**Visual quality:** not machine-scored. Judged by eye against the style benchmarks and protected by `npm run test:visual`.
