import {Config} from '@remotion/cli/config';
import {existsSync} from 'node:fs';

// Use a locally installed headless Chrome when one is available (set
// REMOTION_BROWSER_EXECUTABLE to point at yours). Otherwise Remotion
// downloads its own copy on first render.
const localChrome =
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browser =
  process.env.REMOTION_BROWSER_EXECUTABLE ?? (existsSync(localChrome) ? localChrome : null);
Config.setBrowserExecutable(browser);

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(18);
