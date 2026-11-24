import {continueRender, delayRender, staticFile} from 'remotion';

/** The engine's UI font, bundled in public/fonts so renders look identical on every machine. */
export const FONT = 'ToonInter, Inter, Verdana, sans-serif';
/** Editorial serif (Caladea, OFL). */
export const SERIF = 'ToonSerif, Georgia, serif';

const faces: [string, string, string, string][] = [
  ['ToonInter', '700', 'normal', 'fonts/Inter-Bold.otf'],
  ['ToonInter', '900', 'normal', 'fonts/Inter-Black.otf'],
  ['ToonSerif', '400', 'normal', 'fonts/Caladea-Regular.ttf'],
  ['ToonSerif', '700', 'normal', 'fonts/Caladea-Bold.ttf'],
  ['ToonSerif', '700', 'italic', 'fonts/Caladea-BoldItalic.ttf'],
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading fonts');
  Promise.all(
    faces.map(([family, weight, style, file]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, {weight, style});
      document.fonts.add(face);
      return face.load();
    }),
  )
    .catch((err) => console.error('Font load failed', err))
    .finally(() => continueRender(handle));
}
