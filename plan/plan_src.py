"""Plan source for a vertical inkbeat Short: shots, accents and tags anchored to WORDS of the voice-over, not to seconds.
Re-run after every VO change; the times move with the words. Run it from the project folder; it writes
src/plan.gen.ts and plan.json there (or to the path you pass) and prints a short report.

    python plan/plan_src.py vo/timings.json [src/plan.gen.ts]

timings.json: {"turns": [{"turn": 1, "words": [{"w": "Hello", "t": 0.12, "end": 0.48}, ...]}, ...]}
FIRST edit SHOTS, ACCENT and TAGS below: every anchor must be a word of YOUR voice-over, with the turn number as it
appears in your timings.json (some aligners count turns from 0).

The generated module plugs into the starter's captions:
    import { WORDS, ACCENT_WORDS, DURATION, FPS } from "./plan.gen";
    const chunks = makeChunks(WORDS as unknown as Word[], DURATION / FPS);
    <Captions chunks={chunks} t={t} accent={new Set(ACCENT_WORDS)} />
"""
import json
import re
import sys
from pathlib import Path

FPS = 30
LEAD = 2  # captions appear 2 frames before the word (applied by makeChunks in core/captions.tsx)

# ---- the story, by words ---------------------------------------------------------------------------------------
# A shot is a setup (a set, a mood, a lens). Inside it the beat rig moves the camera about once a second (SKILL.md
# section 1); change setups only where the picture must change (a new subject, a reaction, the payoff).
# Pilot "Chintu aur Patang" (first-short-pilot.md): 15 s, 41 words Roman Hindi, 3 setups.
# Timings in vo/timings.json are ESTIMATED (~2.9 words/sec, turns 0-6 / 6-11 / 11-14.3 s).
# Replace them with real TTS / forced-alignment timings and re-run before the final render.
SHOTS = [
    # id,     anchor (turn, word, nth), mood,    lens note
    ("S01", (1, "aaj", 1), "day", "medium, kid (CAST.kid) 3/4, face at ~38% of the height; kite + wire in frame in first 2 s"),
    ("S02", (2, "neeche", 1), "dusk", "wide from the rooftop down to the gali; laughing neighbours small below, kid low in frame (day -> dusk)"),
    ("S03", (3, "phir", 1), "golden", "close-up / macro on the kite string + kite lifting; golden payoff"),
]
# Captions are ALL WHITE for this pilot: no accent color at all.
ACCENT = set()
# Painted tags: only the story's key facts, on the key object, about one per 15 s. Never on everything.
TAGS = [
    # (turn, word, text, on-object note)
    (1, "patang", "PATANG", "painted on the kite itself, unlit, large, high contrast"),
]
# Camera beats: one move per row, starting 6 frames (0.2 s) before its word (skill section 1).
# 14 beats in 15 s = 56/min. PUSH 8 / PULL 4 = 2:1, plus 2 orbits. The two setup-change beats
# (neeche, phir) are 0.9 s moves to the new setup lens (a push-through, NOT a hard cut).
# move durations follow camera-and-editing.md: PUSH 0.63, PULL 0.66, ORBIT 0.7, big moves 0.9.
BEATS = [
    # (turn, word, nth, move, dur)
    (1, "aaj", 1, "PUSH", 0.63),
    (1, "patang", 1, "PUSH", 0.63),
    (1, "mein", 1, "PULL", 0.66),
    (1, "bijli", 1, "PUSH", 0.63),
    (1, "taar", 1, "ORBIT_L", 0.7),
    (1, "atki", 1, "PULL", 0.66),
    (2, "neeche", 1, "PUSH", 0.9),   # setup change S01 -> S02 (push-through to the wide lens)
    (2, "has", 1, "PULL", 0.66),
    (2, "upar", 1, "PUSH", 0.63),
    (2, "soch", 1, "ORBIT_R", 0.7),
    (3, "phir", 1, "PUSH", 0.9),     # setup change S02 -> S03 (push-through to the close-up lens)
    (3, "khinchi", 1, "PULL", 0.66),
    (3, "neeche", 1, "PUSH", 0.63),
    (3, "udd", 1, "PUSH", 0.63),
]


def norm(w):
    """the same normalization as core/captions.tsx: lowercase, keep letters, digits, ' and -"""
    return re.sub(r"[^a-z0-9'-]", "", w.lower())


def load(p):
    words = []
    for tr in json.loads(Path(p).read_text(encoding="utf8"))["turns"]:
        for w in tr["words"]:
            words.append({"turn": tr["turn"], "w": w["w"], "t": w["t"], "end": w["end"]})
    if not words:
        raise SystemExit(f"no words in {p}")
    return words


def find(words, turn, word, nth=1):
    k = 0
    for w in words:
        if w["turn"] == turn and norm(w["w"]) == norm(word):
            k += 1
            if k == nth:
                return w
    turns = sorted({w["turn"] for w in words})
    raise SystemExit(f"anchor not found: turn {turn} word {word!r} #{nth} (turns in this file: {turns}); "
                     "edit SHOTS / ACCENT / TAGS to words of your voice-over")


def chunk_count(words):
    """the same 1-2 word rule as makeChunks() in core/captions.tsx, for the report"""
    letters = lambda s: len(re.sub(r"[^a-z0-9]", "", s.lower()))
    i = n = 0
    while i < len(words):
        w = words[i]["w"]
        nx = words[i + 1]["w"] if i + 1 < len(words) else None
        two = nx is not None and not re.search(r"[.?!,]$", w) and letters(w) <= 4 and letters(nx) <= 5 \
            and letters(w) + letters(nx) <= 9
        i += 2 if two else 1
        n += 1
    return n


def main(p, out):
    out = Path(out)
    if not out.parent.is_dir():
        raise SystemExit(f"{out.parent} does not exist: run this from the project folder or pass the output path")
    words = load(p)
    total = words[-1]["end"] + 0.6
    shots = []
    for i, (sid, (tn, wd, nth), mood, note) in enumerate(SHOTS):
        t0 = 0.0 if i == 0 else find(words, tn, wd, nth)["t"]
        shots.append({"id": sid, "t": round(t0, 3), "mood": mood, "note": note})
    for a, b in zip(shots, shots[1:] + [{"t": total}]):
        a["end"] = round(b["t"], 3)
        if a["end"] - a["t"] < 1.5:
            print(f"WARN {a['id']} is only {a['end'] - a['t']:.2f} s")
    for tn, wd in ACCENT:
        find(words, tn, wd)  # every accent word must exist
    accent_words = sorted({norm(wd) for _, wd in ACCENT})
    tags = [{"text": tx, "t": round(find(words, tn, wd)["t"], 3), "note": nt} for tn, wd, tx, nt in TAGS]
    # Beats: 6 frames (0.2 s) before their word, clamped to 0. The camera path is continuous
    # (setup changes are `to` moves in the component), so hard cuts = 0 by construction.
    beats = []
    for tn, wd, nth, move, dur in BEATS:
        onset = find(words, tn, wd, nth)["t"]
        beats.append({"t": round(max(0.0, onset - 0.2), 3), "move": move, "dur": dur, "word": norm(wd)})
    pushes = sum(1 for b in beats if b["move"] == "PUSH")
    pulls = sum(1 for b in beats if b["move"] == "PULL")
    gaps = [b2["t"] - b1["t"] for b1, b2 in zip(beats, beats[1:])] + [total - beats[-1]["t"]]
    starts_on_beat = sum(1 for s in shots if any(abs(b["t"] - max(0.0, s["t"] - 0.2)) < 0.01 for b in beats))
    print(f"{len(shots)} shots, {chunk_count(words)} caption chunks, {len(accent_words)} accent words, "
          f"{len(tags)} tags, {total:.2f} s")
    print(f"STATS beats={len(beats)} beats/min={len(beats) / total * 60:.1f} (target 56 +- 4) "
          f"push:pull={pushes}:{pulls} hard_cuts=0 longest_setup={max(s['end'] - s['t'] for s in shots):.1f}s "
          f"longest_beat_gap={max(gaps):.2f}s sentence_starts_on_beat={starts_on_beat}/{len(shots)} "
          f"words={len(words)}")
    if len(accent_words) > max(1, total / 4):
        print("WARN too many accents: about one per sentence")
    if len(tags) > max(1, total / 15 + 1):
        print("WARN too many tags: about one per 15 s, key facts only")
    rows = [[w["w"], round(w["t"], 3), round(w["end"], 3)] for w in words]
    out.write_text(
        "// generated by plan/plan_src.py from vo/timings.json (ESTIMATED timings - see vo/timings.json); do not edit\n"
        f"export const FPS = {FPS};\nexport const DURATION = {round(total * FPS)};\n"
        f"export const SHOTS = {json.dumps(shots)} as const;\n"
        "/** [text, onset s, end s] for makeChunks() in core/captions.tsx */\n"
        f"export const WORDS = {json.dumps(rows)} as const;\n"
        f"export const ACCENT_WORDS = {json.dumps(accent_words)} as const;\n"
        f"export const TAGS = {json.dumps(tags)} as const;\n"
        "/** camera beats for core/rig.ts poseAt(): t is 6 frames before the word; the component maps the two\n"
        " * setup-change beats (words 'neeche' turn 2, 'phir' turn 3) to explicit target lenses (`to`). */\n"
        f"export const BEATS = {json.dumps(beats)} as const;\n", encoding="utf8")
    plan = out.parent.parent / "plan.json" if out.parent.name == "src" else out.with_suffix(".json")
    plan.write_text(json.dumps({"fps": FPS, "duration_s": round(total, 3), "shots": shots,
                                "accent_words": accent_words, "tags": tags, "beats": beats,
                                "stats": {"beats": len(beats), "beats_per_min": round(len(beats) / total * 60, 1),
                                          "push_pull": f"{pushes}:{pulls}", "hard_cuts": 0,
                                          "longest_setup_s": round(max(s["end"] - s["t"] for s in shots), 2),
                                          "longest_beat_gap_s": round(max(gaps), 2),
                                          "sentence_starts_on_beat": f"{starts_on_beat}/{len(shots)}",
                                          "words": len(words), "timings": "ESTIMATED"}}, indent=1), encoding="utf8")
    print("wrote", out, "and", plan)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "vo/timings.json", sys.argv[2] if len(sys.argv) > 2 else "src/plan.gen.ts")
