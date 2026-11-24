# Toon Engine

A code-driven 2D cartoon animation engine for a YouTube channel. Write an episode as a
JSON script and get a 16:9 video, a 9:16 Short and a thumbnail, with no per-video
animation work and no generation costs.

Built on [Remotion](https://www.remotion.dev) (React + TypeScript). All art is
procedural SVG, so renders are fast, sharp at any resolution, and consistent.

## Quick start

Needs Node.js 20+ and ffmpeg (`brew install node ffmpeg` on a Mac).

```bash
npm install
```

```bash
npm run studio
```

Opens the Remotion Studio in your browser: scrub through every episode, in every format.

```bash
npm run render -- Ep001
```

Writes `out/Ep001-Long.mp4`, `out/Ep001-Short.mp4` and `out/Ep001-Thumb.png`.

## Making an episode

1. Copy `src/episodes/ep002-fast-learners.json` (narrated) or `ep001-big-idea.json` (dialogue).
2. Add it to `src/episodes/scripts.ts`.
3. `npm run check` to catch mistakes, `npm run studio` to preview, `npm run render -- <id>` to export.

The full format is in [docs/SCRIPT_FORMAT.md](docs/SCRIPT_FORMAT.md).

### Two styles, mix freely

- **Dialogue:** characters talk (`"say": "mia"`). Their mouths move and subtitles show their name.
- **Narrated / faceless:** an off-screen voice (`"narrate": "..."`) while characters act. Subtitles
  highlight word by word, Shorts-style.

### Voice-over

Put one clip per line in `public/vo/<episode>/`, reference it with `"audio": "vo/ep003/001.mp3"`,
then run `npm run sync-audio`. Timing, lip-sync and subtitles follow the real audio.
Without audio, timing is estimated from the text so you can preview before recording.

## Commands

| Command | What it does |
| --- | --- |
| `npm run studio` | Live preview of every composition |
| `npm run check [-- <id>]` | Validate scripts: unknown poses, overlapping actors, pacing, missing files |
| `npm run render [-- <id>] [--long\|--short\|--thumb]` | Export to `out/` |
| `npm run sync-audio` | Measure audio in `public/` so timing matches the voice-over |
| `npm run typecheck` | TypeScript check |

See [PROJECT.md](PROJECT.md) for architecture, quality benchmarks and the roadmap.
