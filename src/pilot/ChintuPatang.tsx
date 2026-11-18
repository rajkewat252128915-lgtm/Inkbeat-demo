// Chintu aur Patang — the approved first Short pilot (15 s, 1080x1920, 450 frames at 30 fps).
// Plan-first build from plan/plan_src.py (src/plan.gen.ts + plan.json): 3 setups only at story turns,
// 14 camera beats (56.4/min), 0 hard cuts — setup changes are 0.9 s push-through moves to the new
// setup lens (`to`), never a one-frame swap. Captions are all white, 1-2 words, at 70% height.
// NOT RENDERED HERE: this VM cannot create a WebGL context (see first-short-pilot.md / BUILD.md).
// ChintuPatangSub renders the same at 120 fps for motion blur (ffmpeg tmix, see core/frame.tsx).
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CAST } from "../inkbeat/char/cast";
import { bodyYawOf, Character3D, headOf } from "../inkbeat/char/Character3D";
import type { CharacterSpec, FaceState, Pose } from "../inkbeat/char/Character3D";
import { CLOTH } from "../inkbeat/char/family";
import { Captions, makeChunks } from "../inkbeat/core/captions";
import type { Word } from "../inkbeat/core/captions";
import { CastLight } from "../inkbeat/core/castLight";
import { subFrame, useFonts } from "../inkbeat/core/frame";
import { holdInFront } from "../inkbeat/core/ik";
import { boxG, cylG, Label, M, sphG } from "../inkbeat/core/kit";
import { toonMaterial } from "../inkbeat/mat/materials";
import { moodOf } from "../inkbeat/core/moods";
import { aim, poseAt, withShake } from "../inkbeat/core/rig";
import type { Beat, BeatPrm, Cam } from "../inkbeat/core/rig";
import { medium } from "../inkbeat/core/shots";
import { View } from "../inkbeat/core/View";
import type { V3 } from "../inkbeat/types";
import { ACCENT_WORDS, BEATS, WORDS } from "../plan.gen";
import { Crate, House, Planter } from "../demo/Street";

export const PILOT_FRAMES = 450;
export const PILOT_FPS = 30;

const KID = CAST.kid;
const KID_POS: V3 = [0, 0, 0];
const KID_YAW = 0.45;
const CHUNKS = makeChunks(WORDS as unknown as Word[], 15);
const LAST_END = WORDS[WORDS.length - 1][2];
const BEATS_T: Beat[] = BEATS as unknown as Beat[];

// Neighbours: same family (family.ts), adult + elder overrides only — no new family, no real likeness.
const NEIGHBOUR_A: CharacterSpec = {
  ...CAST.adult,
  look: { ...CAST.adult.look, colors: { top: CLOTH.mustard, inner: CLOTH.cream, bottom: CLOTH.charcoal, shoes: CLOTH.chestnut, accent: CLOTH.brass }, seed: 11 },
};
const NEIGHBOUR_B: CharacterSpec = {
  ...CAST.elder,
  look: { ...CAST.elder.look, colors: { top: CLOTH.sage, inner: CLOTH.rose, bottom: CLOTH.cocoa, shoes: CLOTH.chestnut, accent: CLOTH.cream }, seed: 12 },
};
const NEIGHBOURS: { spec: CharacterSpec; p: V3; yaw: number }[] = [
  { spec: NEIGHBOUR_A, p: [-1.2, -2.6, -5.5], yaw: 0.3 },
  { spec: NEIGHBOUR_B, p: [1.4, -2.6, -5.8], yaw: -0.4 },
];

/** Kite position: stuck on the power wire (y 2.55) with a small deterministic sway; from t = 11 s
 * (the pull on "khinchi") it lifts — the payoff action, shown whole, never a jump cut. */
const kiteAt = (t: number): V3 => {
  const u = Math.min(1, Math.max(0, (t - 11) / 3.3));
  const lift = u * u * (3 - 2 * u); // smoothstep
  return [0.7 + Math.sin(t * 0.9) * 0.06 + lift * 0.4, 2.55 + Math.sin(t * 1.3) * 0.04 + lift * 1.1, -1.6 - lift * 0.5];
};

/** A thin taut string between two points (hand -> kite). Pure function of its endpoints. */
const StringLine: React.FC<{ a: V3; b: V3 }> = ({ a, b }) => {
  const mat = React.useMemo(() => toonMaterial({ color: "#3a2a22" }), []);
  const dir = React.useMemo(() => new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), [a, b]);
  const len = dir.length();
  const mid: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const quat = React.useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize()), [dir]);
  return <mesh geometry={cylG(0.006, 0.006, 1, 6)} material={mat} position={mid} quaternion={quat} scale={[1, len, 1]} castShadow={false} />;
};

/** The kite: a red diamond panel with the ONE sound-off tag, PATANG, painted on it (unlit, so the
 * key light can never wash it out), a small tail, and the power wire it is stuck on. */
const Kite: React.FC<{ t: number }> = ({ t }) => {
  const k = kiteAt(t);
  return (
    <group position={k}>
      <M g={boxG(0.55, 0.75, 0.02)} c="#d84a2a" tex="fabric" r={[0, 0, Math.PI / 4]} />
      <M g={boxG(0.4, 0.06, 0.02)} c="#f4ead6" r={[0, 0, Math.PI / 4]} p={[0, 0.1, 0.012]} />
      <Label text="PATANG" p={[0, -0.02, 0.03]} w={0.5} h={0.16} fg="#ffffff" bg="none" font={0.62} />
      {[0, 1, 2].map((i) => (
        <M key={i} g={boxG(0.09, 0.09, 0.01)} c={i % 2 ? "#3c5280" : "#d6a137"} r={[0, 0, Math.PI / 4]} p={[0.03 * (i % 2 ? 1 : -1), -0.62 - i * 0.16, 0]} />
      ))}
    </group>
  );
};

/** One rooftop set, dressed in three depth layers, >= 12 props in every framing.
 * Foreground: water tank, clothes line, planters, crates. Mid: kid, kite string, antenna, bucket,
 * stool, broom, pot, basket, dish. Background: parapet, power wire + poles, 3 neighbouring
 * rooftops, the gali below with its floor, wall and 2 neighbours. No real brands or logos. */
const Rooftop: React.FC<{ t: number; hand: V3 }> = ({ t, hand }) => (
  <group>
    {/* floor + parapet (parapet bottoms sit 1 cm above the floor: no shared faces, no z-fighting) */}
    <M g={boxG(10, 0.2, 8)} c="#8a8290" tex="stone" ts={1.5} p={[0, -0.1, -0.5]} cast={false} />
    <M g={boxG(10, 0.9, 0.15)} c="#c8a888" tex="plaster" p={[0, 0.46, 3.42]} />
    <M g={boxG(10, 0.9, 0.15)} c="#c8a888" tex="plaster" p={[0, 0.46, -4.42]} />
    <M g={boxG(0.15, 0.9, 8)} c="#c8a888" tex="plaster" p={[-4.92, 0.46, -0.5]} />
    <M g={boxG(0.15, 0.9, 8)} c="#c8a888" tex="plaster" p={[4.92, 0.46, -0.5]} />
    {/* foreground: water tank, clothes line, planters, crates */}
    <M g={cylG(0.45, 0.45, 1.0, 20)} c="#3b3d46" tex="metal" p={[-1.7, 0.5, 1.9]} />
    <M g={cylG(0.48, 0.48, 0.08, 20)} c="#2b2d35" p={[-1.7, 1.04, 1.9]} />
    <M g={cylG(0.04, 0.04, 1.6, 10)} c="#2a3238" tex="metal" p={[1.6, 0.8, 1.4]} />
    <M g={cylG(0.04, 0.04, 1.6, 10)} c="#2a3238" tex="metal" p={[2.7, 0.8, 0.5]} />
    <M g={cylG(0.012, 0.012, 1.45, 6)} c="#3a2a22" r={[0, 0, Math.PI / 2]} p={[2.15, 1.55, 0.95]} cast={false} />
    {[[1.85, "#d6a137"], [2.15, "#3c5280"], [2.45, "#c46a78"]].map(([x, c]) => (
      <M key={x as number} g={boxG(0.32, 0.5, 0.02)} c={c as string} tex="fabric" p={[x as number, 1.28, 0.95]} />
    ))}
    <Planter p={[-1.1, 0, 2.2]} />
    <Planter p={[2.2, 0, 2.0]} />
    <Crate p={[2.6, 0, 1.8]} yaw={0.4} />
    <Crate p={[-2.4, 0, 1.2]} s={0.45} yaw={-0.3} />
    {/* mid: antenna, bucket, stool, broom, pot, basket, dish */}
    <M g={cylG(0.04, 0.05, 2.2, 10)} c="#2a3238" tex="metal" p={[-2.2, 1.1, -1.0]} />
    <M g={boxG(0.7, 0.04, 0.04)} c="#2a3238" p={[-2.2, 2.0, -1.0]} />
    <M g={boxG(0.04, 0.04, 0.5)} c="#2a3238" p={[-2.2, 1.8, -1.0]} />
    <M g={cylG(0.16, 0.13, 0.3, 16)} c="#b0503c" tex="metal" p={[0.9, 0.15, 1.6]} />
    <M g={boxG(0.45, 0.08, 0.45)} c="#a88e63" tex="wood" p={[-0.9, 0.42, 1.4]} />
    {[0.18, -0.18].map((x) => (
      <M key={x} g={boxG(0.06, 0.4, 0.06)} c="#6b4b3b" tex="wood" p={[-0.9 + x, 0.2, 1.4]} />
    ))}
    <M g={cylG(0.03, 0.03, 1.5, 10)} c="#6b4b3b" tex="wood" r={[0.2, 0, 0.15]} p={[1.9, 0.75, 2.6]} />
    <M g={boxG(0.3, 0.12, 0.06)} c="#d6a137" p={[1.78, 0.06, 2.72]} />
    <M g={sphG(0.22, 16)} c="#a85a3a" tex="brick" p={[-1.9, 0.22, 0.4]} />
    <M g={cylG(0.28, 0.24, 0.35, 16)} c="#7c9868" tex="fabric" p={[1.2, 0.18, 2.4]} />
    <M g={cylG(0.04, 0.04, 1.1, 10)} c="#2a3238" tex="metal" p={[2.9, 0.55, -3.9]} />
    <M g={cylG(0.35, 0.35, 0.04, 20)} c="#c8d0dc" tex="metal" r={[0.9, 0, 0.5]} p={[2.9, 1.2, -3.9]} />
    {/* power wire the kite is stuck on, on two poles */}
    <M g={cylG(0.05, 0.06, 2.6, 10)} c="#2a3238" tex="metal" p={[-2.8, 1.3, -1.7]} />
    <M g={cylG(0.05, 0.06, 2.6, 10)} c="#2a3238" tex="metal" p={[2.8, 1.3, -1.7]} />
    <M g={cylG(0.02, 0.02, 6.0, 8)} c="#2b2d35" r={[0, 0, Math.PI / 2]} p={[0, 2.55, -1.7]} cast={false} />
    <StringLine a={hand} b={kiteAt(t)} />
    <Kite t={t} />
    {/* background: neighbouring rooftops + the gali below */}
    <House p={[-4.5, -2.6, -8]} w={5} h={5} d={4} wall="#f0c89a" tex="plaster" roof="#9a4a3a" windows={2} lit={[1]} />
    <House p={[1.8, -2.6, -8.4]} w={5.4} h={6.4} d={4.2} wall="#b8604a" tex="brick" roof="#4a4a6a" windows={3} />
    <House p={[7.6, -2.6, -7.8]} w={5} h={4.6} d={4} wall="#9ab8c8" tex="plaster" roof="#7a3a3a" windows={2} />
    <M g={boxG(12, 0.2, 6)} c="#7a7280" tex="stone" ts={1.5} p={[0, -2.7, -6]} cast={false} />
    <M g={boxG(12, 3, 0.2)} c="#9a8a7a" tex="plaster" p={[0, -1.1, -9]} cast={false} />
    {NEIGHBOURS.map((n, i) => (
      <Character3D
        key={i}
        {...n.spec}
        position={n.p}
        yaw={n.yaw}
        t={t + i}
        face={{ eyes: "open", mouth: "grin", brows: "raised" }}
        pose={{ armL: [14, 10], armR: [70, 60], armRFwd: 20 }}
        faceCamera={[0, 0, 0]}
      />
    ))}
  </group>
);

const SETUPS = [
  { mood: "day", blur: 1.6, face: { eyes: "open", mouth: "flat", brows: "worried", look: 0.2 } as FaceState, headTilt: 6, headNod: 0 },
  { mood: "dusk", blur: 0.6, face: { eyes: "open", mouth: "frown", brows: "neutral", look: 0 } as FaceState, headTilt: 0, headNod: 6 },
  { mood: "golden", blur: 3.0, face: { eyes: "wide", mouth: "grin", brows: "raised", look: 0.2 } as FaceState, headTilt: -3, headNod: 0 },
] as const;

export const ChintuPatang: React.FC<{ sub?: boolean }> = ({ sub = false }) => {
  const ready = useFonts();
  const g = useCurrentFrame();
  if (!ready) return <AbsoluteFill style={{ background: "#1a1220" }} />;
  const { n, fp } = sub ? subFrame(g) : { n: g, fp: g };
  const t = fp / 30;
  const setupIdx = t < 6 ? 0 : t < 11 ? 1 : 2;
  const setup = SETUPS[setupIdx];
  const m = moodOf(setup.mood);
  const kidHead = headOf(KID_POS, KID.height, KID.build);
  // S01 base lens (medium preset); S02/S03 are explicit target lenses, reached by 0.9 s
  // push-through beats — the camera path never jumps, so there are 0 hard cuts.
  const base = medium({ feet: KID_POS, height: KID.height, facing: KID_YAW, side: 28 });
  const wideCam: Cam = aim([-1.2, 3.0, 3.6], [-0.3, -1.0, -4.0], 60, 0.5);
  const closeCam: Cam = aim([0.2, 2.0, 0.9], kiteAt(11), 42, 0.38);
  const prms: (BeatPrm | undefined)[] = BEATS_T.map((b) => {
    if (b.word === "neeche" && b.t < 6) return { to: wideCam, dur: 0.9 };
    if (b.word === "phir") return { to: closeCam, dur: 0.9 };
    if (b.move === "PUSH") return { frac: setupIdx === 1 ? 0.08 : 0.12 };
    if (b.move === "PULL") return { frac: setupIdx === 1 ? -0.1 : -0.16 };
    if (b.move === "ORBIT_L" || b.move === "ORBIT_R") return { deg: 18 };
    return undefined;
  });
  const p = poseAt(base.cam, BEATS_T, 0, t, prms);
  const cam = withShake(p, p.shake);
  const focus: V3 = setupIdx === 0 ? kidHead : setupIdx === 1 ? [-0.3, -1.0, -4.0] : kiteAt(t);
  // The string is held IN the hand: solve the arm with IK to a chest-height target in front of
  // the kid (holdInFront), and put the string's lower end at the solved hand. The body yaw is
  // quantized to 0.05 rad so the IK solve is cached, not re-run every frame.
  const bodyYaw = bodyYawOf(KID_POS, KID_YAW, cam.pos);
  const yawQ = Math.round(bodyYaw / 0.05) * 0.05;
  const hold = React.useMemo(
    () => holdInFront({ position: KID_POS, yaw: yawQ, height: KID.height, build: KID.build, side: "R", up: setupIdx === 2 ? 0.5 : 0.42, forward: 0.2 }),
    [setupIdx, yawQ],
  );
  const pose: Pose = {
    ...hold.pose,
    armL: [10, 10],
    headTilt: setup.headTilt,
    headNod: setup.headNod,
    bob: setupIdx === 2 ? Math.sin(t * 4) * 2 : 0,
  };
  return (
    <AbsoluteFill style={{ background: "#1a1220" }}>
      <View mood={m} cam={cam} t={t} focus={focus} blur={setup.blur}>
        <Rooftop t={t} hand={hold.hand} />
        <Character3D
          {...KID}
          position={KID_POS}
          yaw={KID_YAW}
          t={t}
          face={setup.face}
          pose={pose}
          faceCamera={cam.pos}
        />
        <CastLight at={kidHead} cam={cam.pos} mood={m} />
      </View>
      <Captions chunks={CHUNKS} t={n / 30} accent={new Set(ACCENT_WORDS)} until={LAST_END + 0.35} />
    </AbsoluteFill>
  );
};
