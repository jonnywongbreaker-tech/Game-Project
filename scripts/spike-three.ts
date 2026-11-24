/**
 * Renderer comparison: times the same frames (v3 shot 1, the procedural atrium)
 * through our SVG Space renderer and through the Three.js spike.
 *   npx tsx scripts/spike-three.ts [frames=60] [gl=swangle]
 * On a Mac with a GPU, pass gl=angle (hardware) for a realistic Three.js number.
 */
import {renderMedia} from '@remotion/renderer';
import {browserExecutable, bundleProject, getComposition, memoryMonitor} from './lib/remotion';

async function main() {
  const frames = Number(process.argv[2] ?? 60);
  const gl = (process.argv[3] ?? 'swangle') as 'swangle' | 'angle' | 'egl' | 'swiftshader';
  const serveUrl = await bundleProject();
  for (const [id, opts] of [['Memory-v3-CinematicGeometric-Long', {}], ['Spike-ThreeAtrium-Long', {chromiumOptions: {gl}}]] as const) {
    const composition = await getComposition(serveUrl, id);
    const mem = memoryMonitor();
    const t0 = Date.now();
    await renderMedia({serveUrl, composition, codec: 'h264', outputLocation: `out/bench/${id}-spike.mp4`, frameRange: [0, frames - 1], browserExecutable, logLevel: 'error', overwrite: true, ...opts});
    const s = (Date.now() - t0) / 1000;
    console.log(`${id.padEnd(36)} ${frames} frames in ${s.toFixed(1)}s → ${((s / frames) * 1000).toFixed(0)} ms/frame · peak ${Math.round(mem.stop() / 1e6)} MB`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
