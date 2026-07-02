// Shared Web Audio drum synths, extracted so both the live pads and the step
// sequencer trigger the same sounds. `playDrum` takes an explicit start `time`
// so the sequencer can schedule hits ahead of the audio clock (jitter-free).

export const DRUM_TYPES = [
  "kick", "snare", "hat", "clap", "tom", "openhat", "rim", "cow", "crash",
  "shaker", "rimshot", "conga",
] as const;
export type DrumType = (typeof DRUM_TYPES)[number];

// Single source of truth for the 9 drums. Used by both the pad player (via
// `key`) and the step sequencer (via `pitches`, aligned to Magenta drum_kit_rnn's
// 9 output classes — the first pitch is the one we send back to the model).
export type Track = { name: string; type: string; key: string; pitches: number[] };
export const TRACKS: Track[] = [
  { name: "Kick",  type: "kick",    key: "Q", pitches: [36, 35] },
  { name: "Snare", type: "snare",   key: "W", pitches: [38, 37, 40] },
  { name: "ClHat", type: "hat",     key: "E", pitches: [42, 44] },
  { name: "OpHat", type: "openhat", key: "A", pitches: [46] },
  { name: "LoTom", type: "tom",     key: "S", pitches: [45, 41, 43] },
  { name: "HiTom", type: "tom",     key: "D", pitches: [48, 47, 50] },
  { name: "Clap",  type: "clap",    key: "Z", pitches: [39] },
  { name: "Ride",  type: "rim",     key: "X", pitches: [51, 53, 59] },
  { name: "Crash", type: "crash",   key: "C", pitches: [49, 52, 55, 57] },
  // Extra percussion (beyond Magenta's 9 classes — filled only by the audio
  // detector, not the AI model). GM pitches: cowbell 56, shaker 82, conga 63/64.
  { name: "Cowbl", type: "cow",     key: "R", pitches: [56] },
  { name: "Shakr", type: "shaker",  key: "T", pitches: [82, 70] },
  { name: "RimSh", type: "rimshot", key: "F", pitches: [37] },
  { name: "Conga", type: "conga",   key: "G", pitches: [63, 64, 62] },
];

let ctxSingleton: AudioContext | null = null;

// Lazily create/resume a single AudioContext (only valid in the browser).
export function getAudioContext(): AudioContext {
  if (!ctxSingleton) {
    const Ctx = window.AudioContext || window.webkitAudioContext!;
    ctxSingleton = new Ctx();
  }
  if (ctxSingleton.state === "suspended") ctxSingleton.resume();
  return ctxSingleton;
}

// Create + resume the context ahead of the first hit so it's already running.
// Call from a user gesture (pointer/keydown) — resuming needs one.
export function warmUpAudio(): void {
  getAudioContext();
}

function envGain(c: AudioContext, t: number, dur: number, vol01: number, peak: number) {
  const g = c.createGain();
  const vol = vol01 * peak;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(c.destination);
  return g;
}

function noiseSource(c: AudioContext, dur: number) {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/**
 * Trigger one drum sound.
 * @param type drum voice to play
 * @param vol01 master volume 0..1
 * @param when audioContext time to start (defaults to now)
 * @return void
 */
export function playDrum(type: string, vol01 = 0.7, when?: number): void {
  const c = getAudioContext();
  // Small offset so the envelope's attack is always scheduled slightly ahead of
  // the clock — avoids the clipped/quiet first hit when the context just woke.
  const t = when ?? c.currentTime + 0.02;
  const g = (dur: number, peak: number) => envGain(c, t, dur, vol01, peak);

  if (type === "kick") {
    // Body: bass sweep. Higher floor (60Hz) so small speakers reproduce it.
    const o = c.createOscillator(); const gg = g(0.5, 1);
    o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(60, t + 0.16);
    o.connect(gg); o.start(t); o.stop(t + 0.5);
    // Beater click: a fast pitch-swept tone in the mids — carries the punch that
    // small speakers reproduce, so the kick reads even without deep bass.
    const oc = c.createOscillator(); oc.type = "triangle";
    oc.frequency.setValueAtTime(320, t); oc.frequency.exponentialRampToValueAtTime(90, t + 0.05);
    const gc = g(0.06, 0.9); oc.connect(gc); oc.start(t); oc.stop(t + 0.06);
  } else if (type === "snare") {
    const n = noiseSource(c, 0.2); const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1200;
    const gg = g(0.2, 0.7); n.connect(f); f.connect(gg); n.start(t); n.stop(t + 0.2);
    const o = c.createOscillator(); const g2 = g(0.12, 0.4); o.frequency.value = 180; o.connect(g2); o.start(t); o.stop(t + 0.12);
  } else if (type === "hat" || type === "openhat") {
    const dur = type === "hat" ? 0.06 : 0.3;
    const n = noiseSource(c, dur); const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 3500;
    const gg = g(dur, 1.1); n.connect(f); f.connect(gg); n.start(t); n.stop(t + dur);
  } else if (type === "clap") {
    const n = noiseSource(c, 0.2); const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1000;
    const gg = g(0.18, 1.05); n.connect(f); f.connect(gg); n.start(t); n.stop(t + 0.18);
  } else if (type === "tom") {
    const o = c.createOscillator(); const gg = g(0.4, 0.9);
    o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(80, t + 0.3);
    o.connect(gg); o.start(t); o.stop(t + 0.4);
  } else if (type === "rim") {
    // Short square click layered with a noise burst so it actually cuts through.
    const o = c.createOscillator(); o.type = "square"; const gg = g(0.08, 0.9); o.frequency.value = 440; o.connect(gg); o.start(t); o.stop(t + 0.08);
    const n = noiseSource(c, 0.06); const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 2000;
    const g2 = g(0.06, 0.7); n.connect(f); f.connect(g2); n.start(t); n.stop(t + 0.06);
  } else if (type === "cow") {
    const o = c.createOscillator(); o.type = "square"; const gg = g(0.16, 0.7); o.frequency.value = 560; o.connect(gg); o.start(t); o.stop(t + 0.16);
    const o2 = c.createOscillator(); o2.type = "square"; const g2 = g(0.16, 0.7); o2.frequency.value = 845; o2.connect(g2); o2.start(t); o2.stop(t + 0.16);
  } else if (type === "crash") {
    const n = noiseSource(c, 0.7); const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 4000;
    const gg = g(0.7, 0.85); n.connect(f); f.connect(gg); n.start(t); n.stop(t + 0.7);
  } else if (type === "shaker") {
    // Bright, short sustained noise burst — a "tss" above the hats.
    const n = noiseSource(c, 0.12); const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000;
    const gg = g(0.12, 0.7); n.connect(f); f.connect(gg); n.start(t); n.stop(t + 0.12);
  } else if (type === "rimshot") {
    // Sharp mid click: square blip + tight bandpassed noise (brighter than rim).
    const o = c.createOscillator(); o.type = "square"; const gg = g(0.05, 0.9); o.frequency.value = 800; o.connect(gg); o.start(t); o.stop(t + 0.05);
    const n = noiseSource(c, 0.05); const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1000; f.Q.value = 2;
    const g2 = g(0.05, 0.8); n.connect(f); f.connect(g2); n.start(t); n.stop(t + 0.05);
  } else if (type === "conga") {
    // Tonal hand drum — a mid pitch sweep, tighter/higher than the tom.
    const o = c.createOscillator(); const gg = g(0.25, 0.85);
    o.frequency.setValueAtTime(360, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.18);
    o.connect(gg); o.start(t); o.stop(t + 0.25);
  }
}
