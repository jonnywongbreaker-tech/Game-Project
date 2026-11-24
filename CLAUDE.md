# Instructions for Claude Code

Read PROJECT.md first: it holds the architecture, design rules, benchmarks and roadmap.

- Before committing: `npm run typecheck` and `npm run check` must pass.
- After changing anything visual, render sample frames and look at them:
  `npx remotion still <Composition> out/check/x.png --frame=<n>`. Render one at a time;
  parallel Remotion renders in this repo can hang.
- Keep `src/script/compile.ts` and `src/engine/{vocab,speech,designs}.ts` free of React/Remotion imports.
- When adding vocabulary (poses, backdrops, actions), update `docs/SCRIPT_FORMAT.md` in the same change.
- Writing an episode from a topic or narration: follow docs/SCRIPT_FORMAT.md. Change the camera
  or add a caption at least every ~10 s, and keep subtitle lines under ~120 characters.
