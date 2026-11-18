# First Short — pilot plan (15 seconds): "Chintu aur Patang"

Prepared 2026-11-17 (evening, Asia/Calcutta). Status: **built, NOT rendered here.**
Approved by Raj 2026-11-18 ("Yeh pilot theek hai, banao"), VO language Roman Hindi
as drafted. Composition `ChintuPatang` is built in `~/workspace/inkbeat-demo/`
(see `BUILD.md` for the full build record). Nothing was rendered here: this VM
cannot render WebGL (`Error creating WebGL context`; `--gl=angle` /
`--gl=swiftshader` fail immediately, `--gl=swangle` hung 243 s with no output —
see MEMORY.md). It is ready to render on a machine with a GPU / working software
GL. The portable project is `~/workspace/inkbeat-demo-portable.zip`
(no `node_modules` — run `npm install` there; re-zipped after the build, now
includes the pilot composition, the plan and `BUILD.md`).

## The pilot script (Roman Hindi VO, 41 words, ~15 s)

> Aaj subah, Chintu ki patang aasmaan mein nahi — bijli ke taar par atki thi.
> Neeche gali mein sab has rahe the. Upar chhat par, Chintu soch raha tha.
> Phir usne dor halke se khinchi… aur patang neeche nahi, upar udd gayi!

Word timings below are **estimates at ~2.9 words/sec, for planning only** (the script
is 41 words, not ~38 as first written — see `vo-options.md`). Before the final
render, replace them with real TTS / forced-alignment timings and re-run
`plan/plan_src.py` — the plan anchors every shot, caption and tag to a *word*,
so the times move with the voice. The estimates live in `vo/timings.json`;
`plan/plan_src.py` generates `src/plan.gen.ts` + `plan.json` from them.

| Turn | Words (caption chunks in brackets) | Est. time |
|---|---|---|
| 1 | [aaj subah] [chintu ki] [patang] [aasmaan mein] [nahi] — [bijli ke] [taar par] [atki thi] | 0.0–6.0 s |
| 2 | [neeche gali] [mein sab] [has rahe] [the] [upar chhat] [par chintu] [soch raha] [tha] | 6.0–11.0 s |
| 3 | [phir usne] [dor halke] [se khinchi] [aur patang] [neeche nahi] [upar udd] [gayi] | 11.0–14.3 s |

Picture ends ~0.7 s after the last word → total ~15 s, 450 frames at 30 fps.

## Shots (setups change only at story turns; beats move the camera ~every 0.9 s inside a setup)

| Shot | Anchor word | Mood | Framing |
|---|---|---|---|
| S01 | turn 1, "aaj" | day | Medium, kid (CAST.kid) 3/4, face at ~38% height; kite + wire in frame in first 2 s |
| S02 | turn 2, "neeche" | day → dusk | Wide from rooftop down to the gali; laughing neighbours small below, kid low in frame |
| S03 | turn 3, "phir" | golden | Close-up / macro on the kite string + kite lifting; payoff light, warm against cool sky |

Beats target: ~56 beats/min (≈14 beats in 15 s), ~0 hard cuts, camera never still
(drift at ~1/3 peak speed between moves), pushes outnumber pulls ~2:1, moves start ~6 frames
before their word, sentence starts land on a beat.

## Cast, set, look

- **Cast:** CAST.kid as Chintu, plus 2–3 neighbours from the same family (same `family.ts`,
  different overrides — never a new family). Heads 3/4, always acting.
- **Set:** one rooftop set, ≥12 props in every framing, three depth layers: foreground (water
  tank edge, drying clothes line, potted plants), mid (kid, kite string, antenna), background
  (neighbouring rooftops, sky). Real scale; string held IN the hand via `holdInFront` + IK.
- **Tags (sound-off readability):** one only — "PATANG" painted on the kite itself, large,
  high contrast, unlit. No other lettering.
- **Captions:** 1–2 lowercase words per chunk (table above), all white, 92 px, centred at 70%
  height, swapped on word onset, 2 frames early.
- **Audio:** VO + music bed ~14 dB under speech, duck −3 dB under voice; SFX on exact words
  (string twang on "khinchi", a soft whoosh on "udd gayi", distant laughter on "has rahe the");
  two-pass loudnorm to −14 LUFS, −1 dBTP. Picture ends with music fading.

## Build status (2026-11-18)

- Composition: **`ChintuPatang`** — 1080×1920, 450 frames, 30 fps
  (`src/pilot/ChintuPatang.tsx`, registered in `src/Root.tsx`), plus
  **`ChintuPatangSub`** — 1800 frames at 120 fps for motion blur.
- Files: `vo/timings.json` (estimated timings), `plan/plan_src.py` (adapted),
  `src/plan.gen.ts` + `plan.json` (generated), `src/pilot/ChintuPatang.tsx`,
  `src/Root.tsx`, `BUILD.md` (full record). Skill untouched; no new character
  family — neighbours are adult/elder overrides of the demo cast.
- Plan stats: 41 words, 29 caption chunks, 14 beats, **56.4 beats/min**
  (target 56 ± 4), push:pull **8:4 (2:1)**, hard cuts **0**, longest setup
  6.0 s, longest beat gap 1.40 s, sentence starts on a beat 3/3.
- Verified here: `npx tsc --noEmit` **pass**; `npx remotion bundle
  src/index.ts --out-dir=build-chintu` **pass** (42 MB, contains
  `ChintuPatang`). No still/render was run or retried here (no WebGL).
- Not verified until stills exist on Raj's machine: S02 wide framing, S03
  close-up framing, mood switches at 6.0 s / 11.0 s, string exactly in hand
  through the moves, PATANG tag whole in frame during the S03 push.
- Still missing: real VO + timings, all audio (VO / music / SFX files),
  the render itself.

## Full 60-second extension (only if the pilot lands)

- Act 2 (15–40 s): the kite pulls Chintu across rooftops — escalation, dusk mood, one new set
  (the gali), the kite as the anchor in every framing.
- Act 3 (40–60 s): the kite frees a second, bigger kite; twist — the "stuck" kite was holding
  the other one; golden payoff, last line lands, picture ends 0.7 s after the last word.
- Same family, same rooftop set reused additively; ~150–170 words total for 60–70 s.

## Render on your own machine (the step this VM cannot do)

Full commands are in `BUILD.md` ("Render on Raj's machine"). Short version,
in the project folder after `npm install` (and `npx remotion bundle
src/index.ts --out-dir=build-chintu`):

```bash
# 1. Pilot stills first — one per setup (S01 frame 30, S02 frame 240, S03 frame 390):
npx remotion still src/index.ts ChintuPatang out/pilot-s01.jpg --frame=30 --scale=0.5 --gl=angle --timeout=240000
npx remotion still src/index.ts ChintuPatang out/pilot-s02.jpg --frame=240 --scale=0.5 --gl=angle --timeout=240000
npx remotion still src/index.ts ChintuPatang out/pilot-s03.jpg --frame=390 --scale=0.5 --gl=angle --timeout=240000
# 2. Motion-blur video (the one to ship): render ChintuPatangSub at 120 fps, then average:
npx remotion render src/index.ts ChintuPatangSub out/pilot-sub.mp4 --gl=angle --timeout=240000 --concurrency=3 --codec=h264 --crf=16 --pixel-format=yuv420p --muted
ffmpeg -i out/pilot-sub.mp4 -vf "tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\,4)\,3)',setpts=N/30/TB" -r 30 -c:v libx264 -crf 16 -pix_fmt yuv420p out/pilot.mp4
```

Quick WebGL check first: in Chrome open `chrome://gpu` — "WebGL: Hardware accelerated"
(or at least "Software accelerated") means the still above should work. If that machine
also shows the same `Error creating WebGL context`, it needs a GPU machine instead.

## What Raj needs to decide (one reply)

1. Topic: **approved** 2026-11-18 — this kite pilot, Roman Hindi VO as drafted.
2. Render machine: will he try the zip on his own computer (stills first, per
   above), or does he want look-dev stills / planning refined here first and
   the render later?
3. Voice-over: no VO file exists yet — record / generate the Roman Hindi VO
   (or say who will), so real word timings can replace the estimates before
   the final render.
