// Fonts (wait for them so no frame ever shows the fallback font) and motion-blur timing.
// Poppins comes from @fontsource/poppins (npm), not from binary .ttf files in
// public/fonts — GitHub push-files only accepts UTF-8 text, so binary fonts
// cannot be pushed that way. The local .ttf files remain on disk as a fallback
// for local renders only; the CI render uses the Fontsource woff2 files.
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import React, { useState } from "react";
import { continueRender, delayRender } from "remotion";

let fontsP: Promise<void> | null = null;
const loadFonts = () => {
  if (!fontsP)
    fontsP = Promise.all([
      document.fonts.load('700 92px Poppins').catch(() => undefined),
      document.fonts.load('800 92px Poppins').catch(() => undefined),
    ]).then(() => undefined);
  return fontsP;
};
export const useFonts = () => {
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender("fonts"));
  React.useEffect(() => {
    loadFonts().then(() => {
      setReady(true);
      continueRender(h);
    });
  }, [h]);
  return ready;
};

/** MOTION BLUR. Register a second composition at SUB × fps with SUB × frames. Sub-frame k of output frame n is drawn at
 * frame position n + ((k + 0.5) / SUB) · shutter − shutter / 2 (shutter 0.5 = 180°). Key captions to n, not to the
 * sub-time, so text stays sharp. Then average with ffmpeg:
 *   ffmpeg -i sub.mp4 -vf "tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\,4)\,3)',setpts=N/30/TB" -r 30 out.mp4 */
export const SUB = 4;
export const subFrame = (g: number, sub = SUB, shutter = 0.5) => {
  const n = Math.floor(g / sub);
  const k = g % sub;
  return { n, fp: Math.max(0, n + ((k + 0.5) / sub) * shutter - shutter / 2) };
};
