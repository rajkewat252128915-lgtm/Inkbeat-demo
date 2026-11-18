# Build record — "Chintu aur Patang" pilot (15 s Short)

Status: **built, NOT rendered here.** This VM cannot create a WebGL context
(`THREE.WebGLRenderer: Error creating WebGL context`; `--gl=angle` and
`--gl=swiftshader` fail immediately, `--gl=swangle` hung 243 s with no output).
No Remotion still/render command was run in this build, and none was retried.

## Composition

- `ChintuPatang` — 1080×1920, 450 frames, 30 fps (`src/pilot/ChintuPatang.tsx`,
  registered in `src/Root.tsx`)
- `ChintuPatangSub` — same, 1800 frames at 120 fps, for motion blur (ffmpeg `tmix`,
  see "Render on Raj's machine" below). Captions are keyed to the output frame,
  so they stay sharp.

## Font note (2026-11-18, before GitHub push)

Poppins now comes from `@fontsource/poppins` (npm, 700 + 800), loaded in
`src/inkbeat/core/frame.tsx` via `document.fonts.load()`. The binary
`public/fonts/*.ttf` files are NOT pushed to GitHub — the GitHub push tool
only accepts UTF-8 text files, and it rejected the snapshot on the first
`.ttf`. They remain on disk locally as a fallback only. The Remotion bundle
includes the Fontsource woff2 files, and `npx tsc --noEmit` + bundle pass
after the change.

## Files created / changed

| File | What |
|---|---|
| `vo/timings.json` (new) | 41 words, 3 turns, ESTIMATED timings (~2.9 words/sec). Marked estimated in the file; replace with real TTS / forced-alignment timings and re-run the planner before the final render. |
| `plan/plan_src.py` (changed) | Pilot SHOTS / TAGS / BEATS, all-white captions (no accent), BEATS export, plan stats printed every run. |
| `src/plan.gen.ts` (generated) | `FPS`, `DURATION`, `SHOTS`, `WORDS`, `ACCENT_WORDS` (empty), `TAGS`, `BEATS`. |
| `plan.json` (generated) | Same plan + `stats` (see below). |
| `src/pilot/ChintuPatang.tsx` (new) | Composition + rooftop set + kite. Reuses the starter: `View`, moods, beat rig (`poseAt`), `medium` shot preset, `Captions`, `CAST.kid`, `holdInFront` + IK for the string, `CastLight`. |
| `src/Root.tsx` (changed) | Registers `ChintuPatang` and `ChintuPatangSub`. |
| `first-short-pilot.md` (updated) | Status, word-count correction (41, not ~38), build stats, render commands. |
| `build-chintu/` (generated, local only) | One Remotion bundle (42 MB). Excluded from the portable zip; re-bundle on Raj's machine with the command below. |

No files in `~/workspace/custom-skills/inkbeat-shorts/` were changed. No new
character family — same `family.ts`; the 2 neighbours are adult/elder overrides
of the demo cast only.

## The build, in brief

- 3 setups only, at story turns: S01 day medium (kid 3/4, face ~38% height, kite +
  wire in frame in the first 2 s), S02 dusk wide from the rooftop down to the gali
  (neighbours small below), S03 golden close-up/macro on the string + lifting kite.
- Camera: one continuous path. The two setup changes are 0.9 s push-through moves
  to explicit target lenses (`to` in the beat rig), never a one-frame swap.
  Between beats the rig drifts (never still). Mood switches at the turn boundary
  (day → dusk → golden); that is a time jump, not a cut.
- Kite: stuck on the power wire with a small deterministic sway; from 11.0 s
  (the pull on "khinchi") it lifts ~1.1 m over the rest of the shot.
- String: from the solved hand (`holdInFront`, IK, chest height, body yaw
  quantized to 0.05 rad so the solve is cached) to the kite, every frame.
- Tag: one only — "PATANG", painted on the kite itself, unlit (white on red),
  large, high contrast. No other lettering anywhere.
- Captions: 29 chunks from `makeChunks` (1–2 lowercase words), all white, 92 px,
  centred at 70% height, swapped on word onset 2 frames early, hidden 0.35 s
  after the last word (14.65 s).
- Audio: not built. No VO, music or SFX files exist yet (see "Still missing").

## Plan stats (from `python3 plan/plan_src.py vo/timings.json src/plan.gen.ts`)

- Words: 41 (turns 14 / 14 / 13). Last word ends 14.302 s; picture ends 15.0 s
  (450 frames). Note: the planner's `DURATION` is 447 frames (last word end +
  0.6 s); the composition is 450 frames so the picture outlasts the voice by
  0.7 s, per the skill.
- Beats: 14, **56.4 beats/min** (target 56 ± 4) — 56.0/min over the full 15 s.
- Push:pull **8:4 (2:1)**, plus 2 orbits. Hard cuts: **0**.
- Longest setup: 6.0 s (S01). Longest gap between beats: 1.40 s.
- Sentence starts on a beat: **3/3**.
- Caption chunks: 29. Accent words: 0. Tags: 1 ("PATANG" at 1.6 s).

## Verification done here (no WebGL involved)

- `npx tsc --noEmit` — **pass, no errors** (run 2026-11-18).
- `npx remotion bundle src/index.ts --out-dir=build-chintu` — **pass**
  (42 MB, `index.html` present, `bundle.js` contains `ChintuPatang`).
  Bundling is webpack only; it does not open a browser or a GL context.
- Plan stats above, printed by the planner (see `plan.json` → `stats`).
- NOT verified here (needs a render + stills on Raj's machine): S02 wide
  framing (does the gali + both neighbours read, is the kid placed right?),
  S03 close-up framing (kite + string fill the frame?), the mood switch at
  6.0 s / 11.0 s, the string sitting exactly in the hand through the moves,
  and the PATANG tag staying whole inside the frame during the S03 push.

## Still missing

- Real VO + word timings: the timings in `vo/timings.json` are estimates.
  Record / generate the Roman Hindi VO, get real timings (TTS alignment or
  forced alignment), replace `vo/timings.json`, re-run the planner, rebuild.
- Audio: VO file, music bed (licensed), SFX on exact words (string twang on
  "khinchi", soft whoosh on "udd gayi", distant laughter on "has rahe the"),
  two-pass loudnorm to −14 LUFS / −1 dBTP. No audio files are in the project.
- The render itself, on a machine with a GPU / working software GL (below).
- QA after the render: `flicker.py`, `analyze_pacing.py`, a 2 fps contact
  sheet read muted, loudness check (skill section 6 / render-and-qa.md).

## Render on Raj's machine

Check WebGL first: in Chrome open `chrome://gpu` — "WebGL: Hardware
accelerated" (or at least "Software accelerated") means the commands below
should work. Then, in the project folder:

```bash
npm install
npx remotion bundle src/index.ts --out-dir=build-chintu
# 1. Pilot stills first — one per setup, before any video render:
npx remotion still src/index.ts ChintuPatang out/pilot-s01.jpg --frame=30 --scale=0.5 --gl=angle --timeout=240000
npx remotion still src/index.ts ChintuPatang out/pilot-s02.jpg --frame=240 --scale=0.5 --gl=angle --timeout=240000
npx remotion still src/index.ts ChintuPatang out/pilot-s03.jpg --frame=390 --scale=0.5 --gl=angle --timeout=240000
# 2. Full video, sharp (one render on the GPU at a time, concurrency <= 3 for tests):
npx remotion render src/index.ts ChintuPatang out/pilot-sharp.mp4 --gl=angle --timeout=240000 --concurrency=3 --codec=h264 --crf=16 --pixel-format=yuv420p --muted
# 3. Motion-blur version (the one to ship): render the 120 fps sub composition, then average:
npx remotion render src/index.ts ChintuPatangSub out/pilot-sub.mp4 --gl=angle --timeout=240000 --concurrency=3 --codec=h264 --crf=16 --pixel-format=yuv420p --muted
ffmpeg -i out/pilot-sub.mp4 -vf "tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\,4)\,3)',setpts=N/30/TB" -r 30 -c:v libx264 -crf 16 -pix_fmt yuv420p out/pilot.mp4
# 4. QA (scripts live in the skill: ~/workspace/custom-skills/inkbeat-shorts/scripts/):
python3 <skill>/scripts/analyze_pacing.py out/pilot.mp4
python3 <skill>/scripts/flicker.py out/pilot.mp4
ffmpeg -i out/pilot.mp4 -vf "fps=2,scale=120:-1,tile=16x8:padding=2" -frames:v 1 out/pilot-sheet.jpg
```

If that machine also shows `Error creating WebGL context`, it needs a GPU
machine instead — do not keep retrying `--gl` modes there.
