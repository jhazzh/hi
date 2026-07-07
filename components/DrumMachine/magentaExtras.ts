// MusicVAE drum sampler — generates fresh 2-bar drum beats in the browser.
// Lazy-loads the checkpoint on first use, then caches.
//
// Grid here is number[][] (velocity 0..1, 0 = off), same as the Sequencer.
import { TRACKS } from "./drumSynth";

type Grid = number[][];

const STEPS = 32;                 // the drum VAE is 2-bar (32 sixteenths)

// Minimal shapes of the Magenta objects we touch (lazy-imported).
type Note = { pitch: number; quantizedStartStep?: number; velocity?: number };
type NoteSequence = { notes: Note[] };
type Vae = {
  initialize: () => Promise<void>;
  sample: (n: number, temperature?: number) => Promise<NoteSequence[]>;
};

const DRUMS_URL = "https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_lokl_small";

let drums: Vae | null = null;

async function ensureDrums(): Promise<Vae> {
  if (!drums) {
    const { MusicVAE } = await import("@magenta/music/esm/music_vae/model");
    const m = new MusicVAE(DRUMS_URL) as unknown as Vae;
    await m.initialize();
    drums = m;
  }
  return drums;
}

const pitchToTrack = (pitch: number) => TRACKS.findIndex((t) => t.pitches.includes(pitch));

// A NoteSequence → a fresh 32-step grid (velocity preserved).
function seqToGrid(seq: NoteSequence): Grid {
  const grid: Grid = TRACKS.map(() => Array<number>(STEPS).fill(0));
  for (const n of seq.notes || []) {
    const ti = pitchToTrack(n.pitch);
    const s = n.quantizedStartStep ?? 0;
    // velocity 0 / missing → default hit (a note present at all means "on").
    if (ti >= 0 && s >= 0 && s < STEPS) grid[ti][s] = n.velocity ? n.velocity / 127 : 0.85;
  }
  return grid;
}

// --- public ops --------------------------------------------------------------

// Sample: N fresh 2-bar drum beats from MusicVAE.
export async function sampleBeats(n = 4, temperature = 1.0): Promise<Grid[]> {
  const m = await ensureDrums();
  const seqs = await m.sample(n, temperature);
  return seqs.map(seqToGrid);
}
