/** Shared helpers for scripts that drive Remotion programmatically (bundle once, render many). */
import {execFileSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';

const LOCAL_CHROME = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
/** Same resolution order as remotion.config.ts. */
export const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? (existsSync(LOCAL_CHROME) ? LOCAL_CHROME : null);

export async function bundleProject(): Promise<string> {
  return bundle({entryPoint: resolve('src/index.ts'), onProgress: () => undefined});
}

export async function getComposition(serveUrl: string, id: string) {
  return selectComposition({serveUrl, id, browserExecutable, logLevel: 'error'});
}

/**
 * Tracks peak resident memory of this process and everything it spawned
 * (Remotion's headless Chrome included). Works on macOS and Linux via `ps`.
 */
export function memoryMonitor(intervalMs = 250) {
  let peak = 0;
  const sample = () => {
    try {
      const rows = execFileSync('ps', ['-A', '-o', 'pid=,ppid=,rss=']).toString().trim().split('\n');
      const kids = new Map<number, number[]>();
      const rss = new Map<number, number>();
      for (const r of rows) {
        const [pid, ppid, kb] = r.trim().split(/\s+/).map(Number);
        rss.set(pid, kb);
        kids.set(ppid, [...(kids.get(ppid) ?? []), pid]);
      }
      let total = 0;
      const stack = [process.pid];
      while (stack.length) {
        const p = stack.pop()!;
        total += rss.get(p) ?? 0;
        stack.push(...(kids.get(p) ?? []));
      }
      peak = Math.max(peak, total * 1024);
    } catch {
      /* ps unavailable: report 0 */
    }
  };
  const timer = setInterval(sample, intervalMs);
  sample();
  return {
    stop: () => {
      clearInterval(timer);
      sample();
      return peak;
    },
  };
}
