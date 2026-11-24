# Latest benchmark

2026-11-24 23:04 UTC · Intel(R) Xeon(R) Processor @ 2.10GHz · 4 cores · 16.9 GB · linux x64 · concurrency default

| Composition | Resolution | Video | Render | FPS | × real time | 10-min video | Peak memory |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V-Urban-Long | 1920x1080 | 5.0s | 23.5s | 6.4 | 4.7 | 47 min | 2580 MB |
| V-Machine-Long | 1920x1080 | 5.0s | 19.2s | 7.8 | 3.84 | 38.4 min | 2443 MB |
| V-Nature-Long | 1920x1080 | 5.0s | 26.9s | 5.6 | 5.38 | 53.8 min | 2854 MB |
| V-Abstract-Long | 1920x1080 | 5.0s | 18.8s | 8 | 3.77 | 37.7 min | 2434 MB |

Bundle (one-off per render session): 3.3s.

**Versatility:** castPresets 5 · poses 8 · expressions 7 · backdrops 4 · captionStyles 3 · visualStyles 3 · characterStates 56

**Manual intervention:** Ep001: 19.7 authored beats/min, 2718 bytes of script/min, 0 QC warnings; Ep002: 15.2 authored beats/min, 2728 bytes of script/min, 0 QC warnings. Steps per video: write script → npm run check → npm run render.

**Visual quality:** not machine-scored. Judged by eye against the style benchmarks and protected by `npm run test:visual`.
