import {continueRender, delayRender, staticFile} from 'remotion';

/** The engine's UI font, bundled in public/fonts so renders look identical on every machine. */
export const FONT = 'ToonInter, Inter, Verdana, sans-serif';

const faces: [string, string][] = [
  ['700', 'fonts/Inter-Bold.otf'],
  ['900', 'fonts/Inter-Black.otf'],
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading fonts');
  Promise.all(
    faces.map(([weight, file]) => {
      const face = new FontFace('ToonInter', `url(${staticFile(file)})`, {weight});
      document.fonts.add(face);
      return face.load();
    }),
  )
    .catch((err) => console.error('Font load failed', err))
    .finally(() => continueRender(handle));
}
