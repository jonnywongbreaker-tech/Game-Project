# Latest benchmark

2026-11-25 05:25 UTC · Apple M6 · 12 cores · 25.8 GB · darwin arm64 · concurrency default

| Composition | Resolution | Video | Render | FPS | × real time | 10-min video | Peak memory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ep001-Long | 1920x1080 | 42.8s | 12.7s | 101.1 | 0.3 | 3 min | 4275 MB |
| Ep001-Short | 1080x1920 | 42.8s | 11.4s | 112.1 | 0.27 | 2.7 min | 3453 MB |
| Memory-A-Geometric-Long | 1920x1080 | 15.0s | 4.4s | 101.7 | 0.3 | 3 min | 3485 MB |
| Memory-B-Textured-Long | 1920x1080 | 15.0s | 17.9s | 25.2 | 1.19 | 11.9 min | 5783 MB |
| Memory-C-Cinematic-Long | 1920x1080 | 15.0s | 75.3s | 6 | 5.02 | 50.2 min | 7482 MB |

Bundle (one-off per render session): 3.4s.

**Versatility:** castPresets 5 · poses 8 · expressions 7 · backdrops 4 · captionStyles 3 · visualStyles 3 · characterStates 56

**Manual intervention:** Ep001: 19.7 authored beats/min, 2718 bytes of script/min, 0 QC warnings; Ep002: 15.2 authored beats/min, 2728 bytes of script/min, 0 QC warnings. Steps per video: write script → npm run check → npm run render.

**Visual quality:** not machine-scored. Judged by eye against the style benchmarks and protected by `npm run test:visual`.
