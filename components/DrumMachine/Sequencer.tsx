'use client';
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioContext, playDrum, TRACKS } from "./drumSynth";
import { STYLES, stylesToParams, type DrumParams } from "./promptToParams";
import { sampleBeats } from "./magentaExtras";
import "./Sequencer.scss";

const STEPS = 16;          // Magenta output width (the model emits 16 steps)
const GRID_STEPS = 32;     // default grid width — fills the sequencer area (2 bars)
const DEFAULT_VEL = 0.85;  // velocity for a manually-toggled hit

// Grid cells hold velocity: 0 = off, (0..1] = on at that loudness. Positive
// values are truthy, so `if (cell)` still reads as "is this step on?".
type Grid = number[][];

const emptyGrid = (): Grid =>
  TRACKS.map(() => Array<number>(GRID_STEPS).fill(0));

type MagentaStatus = "idle" | "loading" | "ready" | "thinking";

export default function Sequencer({ volume }: { volume: number }) {
  const [grid, setGrid] = useState<Grid>(emptyGrid);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [step, setStep] = useState(-1);          // current playhead column
  const [ai, setAi] = useState<MagentaStatus>("idle");
  const [styleSels, setStyleSels] = useState<string[]>([STYLES[0].label]);
  const [style, setStyle] = useState("");        // matched style label
  const [bars, setBars] = useState(2);           // 16-step bars to generate
  const [autoRegen, setAutoRegen] = useState(0); // regenerate every N played bars (0 = off)

  // Advanced AI panel state.
  const [advOpen, setAdvOpen] = useState(false);
  const [samples, setSamples] = useState<Grid[]>([]);// last MusicVAE samples

  // Refs so the scheduler reads live values without re-subscribing.
  const gridRef = useRef(grid); gridRef.current = grid;
  const bpmRef = useRef(bpm); bpmRef.current = bpm;
  const volRef = useRef(volume); volRef.current = volume;
  const rnnRef = useRef<unknown>(null);          // lazily-loaded Magenta model

  const toggle = (t: number, s: number) =>
    setGrid((g) => g.map((row, ti) => (ti === t ? row.map((v, si) => (si === s ? (v ? 0 : DEFAULT_VEL) : v)) : row)));

  const clear = () => { setGrid(emptyGrid()); setStyle(""); };

  // --- Transport: lookahead scheduler (schedules ahead of the audio clock) ---
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextStepRef = useRef(0);
  const nextTimeRef = useRef(0);
  const barCountRef = useRef(0);                    // bars played since last regen
  const autoRegenRef = useRef(autoRegen); autoRegenRef.current = autoRegen;
  const styleSelsRef = useRef(styleSels); styleSelsRef.current = styleSels;
  const regenRef = useRef<(() => void) | null>(null); // set once generate exists

  const stop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setStep(-1);
  }, []);

  const start = useCallback(() => {
    const ctx = getAudioContext();
    nextStepRef.current = 0;
    nextTimeRef.current = ctx.currentTime + 0.06;
    barCountRef.current = 0;
    setPlaying(true);

    // Every 25ms, schedule any steps falling within the next 100ms window.
    timerRef.current = setInterval(() => {
      const c = getAudioContext();
      const secPerStep = 60 / bpmRef.current / 4; // 16th notes
      while (nextTimeRef.current < c.currentTime + 0.1) {
        const s = nextStepRef.current;
        const when = nextTimeRef.current;
        gridRef.current.forEach((row, ti) => {
          const vel = row[s];
          if (vel) playDrum(TRACKS[ti].type, (volRef.current / 100) * vel, when);
        });
        // Reflect the playhead in the UI at the scheduled time.
        const uiStep = s;
        const delayMs = Math.max(0, (when - c.currentTime) * 1000);
        setTimeout(() => setStep(uiStep), delayMs);

        // Wrap on the live grid width (recorded patterns can be wider than 16).
        const width = gridRef.current[0]?.length || GRID_STEPS;
        const nextStep = (s + 1) % width;

        // Auto-regenerate every N bars: count each completed 16-step bar; at the
        // pattern's loop point (wrap to 0), if enough bars elapsed, regenerate.
        if (nextStep % STEPS === 0) barCountRef.current += 1;
        if (autoRegenRef.current > 0 && nextStep === 0 && barCountRef.current >= autoRegenRef.current) {
          barCountRef.current = 0;
          regenRef.current?.();
        }

        nextStepRef.current = nextStep;
        nextTimeRef.current += secPerStep;
      }
    }, 25);
  }, []);

  const togglePlay = () => (playing ? stop() : start());

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // --- Magenta: load model once, generate / continue a groove ---
  const ensureModel = async () => {
    if (rnnRef.current) return rnnRef.current;
    setAi("loading");
    const { MusicRNN } = await import("@magenta/music/esm/music_rnn/model");
    const rnn = new MusicRNN(
      "https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/drum_kit_rnn"
    );
    await rnn.initialize();
    rnnRef.current = rnn;
    setAi("ready");
    return rnn;
  };

  type SeqNote = { pitch: number; quantizedStartStep: number; quantizedEndStep: number; isDrum: boolean; velocity?: number };

  // Build an already-quantized NoteSequence from a list of notes. `totalSteps`
  // sets where the seed ends — the model then generates AFTER that point.
  const buildSequence = (notes: SeqNote[], totalSteps: number) => ({
    notes,
    quantizationInfo: { stepsPerQuarter: 4 },
    totalQuantizedSteps: totalSteps,
  });

  // Notes for the current grid (empty if nothing is toggled). Uses each
  // track's canonical (first) pitch when sending back to the model.
  const gridNotes = (): SeqNote[] => {
    const notes: SeqNote[] = [];
    gridRef.current.forEach((row, ti) => {
      row.forEach((v, s) => {
        if (v) notes.push({ pitch: TRACKS[ti].pitches[0], quantizedStartStep: s, quantizedEndStep: s + 1, isDrum: true, velocity: Math.round(v * 127) });
      });
    });
    return notes;
  };

  // Find which track a model pitch belongs to (−1 if none).
  const trackForPitch = (pitch: number) => TRACKS.findIndex((t) => t.pitches.includes(pitch));

  // Blank grid of a given width.
  const blankGrid = (width: number): Grid =>
    TRACKS.map(() => Array<number>(width).fill(0));

  // Write a NoteSequence's notes onto `grid`, offsetting steps by `shift`.
  // Note velocity (0..127) maps to cell velocity (0..1); default 0.85.
  const writeNotes = (grid: Grid, notes: { pitch: number; quantizedStartStep?: number; velocity?: number }[], shift = 0) => {
    notes.forEach((n) => {
      const ti = trackForPitch(n.pitch);
      const s = (n.quantizedStartStep ?? 0) + shift;
      // Use the note's velocity only if it's a real positive value — the drum
      // RNN emits velocity 0 (or none), which must map to a played hit, not off.
      if (ti >= 0 && s >= 0 && s < grid[0].length) grid[ti][s] = n.velocity ? n.velocity / 127 : DEFAULT_VEL;
    });
  };

  type Rnn = { continueSequence: (seq: unknown, steps: number, temp: number) => Promise<{ notes?: { pitch: number; quantizedStartStep?: number; velocity?: number }[] }> };

  // Generate one 16-step block continuing from `seedNotes` (which end at
  // `seedSteps`). Returns the density-thinned notes (steps 0..15).
  const genBlock = async (rnn: Rnn, seedNotes: SeqNote[], seedSteps: number, temperature: number, density: number) => {
    const seed = buildSequence(seedNotes, seedSteps);
    const out = await rnn.continueSequence(seed, STEPS, temperature);
    return (out.notes || []).filter(() => Math.random() < density);
  };

  // Notes (at steps 0..15) describing one 16-step slice of `grid` starting at
  // column `off` — used to seed the next bar so it flows from the previous one.
  const sliceNotes = (grid: Grid, off: number): SeqNote[] => {
    const notes: SeqNote[] = [];
    grid.forEach((row, ti) => {
      for (let i = 0; i < STEPS; i++) {
        const v = row[off + i];
        if (v) notes.push({ pitch: TRACKS[ti].pitches[0], quantizedStartStep: i, quantizedEndStep: i + 1, isDrum: true, velocity: Math.round(v * 127) });
      }
    });
    return notes;
  };

  // Short human summary of a generated grid: bars, total hits, and the busiest
  // drums. Optional `style` prefix when generated from the style chips.
  const describeGrid = (grid: Grid, style?: string): string => {
    const width = grid[0].length;
    const barCount = Math.round(width / STEPS);
    const counts = grid.map((row) => row.filter(Boolean).length);
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return "empty pattern";
    const top = counts
      .map((c, ti) => ({ name: TRACKS[ti].name, c }))
      .filter((x) => x.c > 0)
      .sort((a, b) => b.c - a.c)
      .slice(0, 3)
      .map((x) => x.name)
      .join(", ");
    const prefix = style && style !== "default" ? `${style} — ` : "";
    return `${prefix}${barCount} bar${barCount > 1 ? "s" : ""}, ${total} hits · mostly ${top}`;
  };

  const generate = async (continueFromGrid: boolean, params?: DrumParams) => {
    if (!params) setStyle("");   // Generate/Continue clear stale record status
    try {
      const rnn = (await ensureModel()) as Rnn;
      setAi("thinking");

      const temperature = params?.temperature ?? 1.25;
      const density = params?.density ?? 1;

      const existing = gridNotes();
      const continuing = continueFromGrid && existing.length > 0;

      let result: Grid;
      if (continuing) {
        // Continue: append `bars` new bars after the current grid, each seeded
        // by the previous bar so the groove flows on.
        const cur = gridRef.current;
        const curWidth = cur[0].length;
        const addBars = Math.max(1, bars);
        const next: Grid = cur.map((r) => [...r, ...Array<number>(addBars * STEPS).fill(0)]);
        let seedNotes = sliceNotes(next, curWidth - STEPS); // last existing bar
        for (let off = curWidth; off < curWidth + addBars * STEPS; off += STEPS) {
          const notes = await genBlock(rnn, seedNotes, STEPS, temperature, density);
          writeNotes(next, notes, off);
          seedNotes = sliceNotes(next, off);
        }
        setGrid(next);
        result = next;
      } else {
        // Fresh groove: generate `bars` 16-step blocks, each seeding the next
        // so the beat evolves. Width = bars × 16 (min one screenful).
        const width = Math.max(1, bars) * STEPS;
        const grid = blankGrid(width);
        let seedNotes: SeqNote[] = [{ pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true }];
        let seedSteps = 1;
        for (let off = 0; off < width; off += STEPS) {
          const notes = await genBlock(rnn, seedNotes, seedSteps, temperature, density);
          writeNotes(grid, notes, off);
          seedNotes = sliceNotes(grid, off);   // this bar seeds the next
          seedSteps = STEPS;
        }
        setGrid(grid);
        result = grid;
      }
      setStyle(describeGrid(result, params?.style));
      setAi("ready");
    } catch (err) {
      console.error(err);
      setAi("idle");
    }
  };

  // Regenerate a fresh groove at the CURRENT grid width (used by auto-regen).
  // Runs quietly — no status spam, keeps playing.
  const regenParamsRef = useRef<DrumParams | undefined>(undefined);
  const regenerate = useCallback(async () => {
    try {
      const rnn = (await ensureModel()) as Rnn;
      // Prefer the LIVE chip selection so changing styles affects the next
      // regen without re-clicking; fall back to the last generate's params.
      const sel = styleSelsRef.current;
      const p = sel.length ? stylesToParams(sel) : regenParamsRef.current;
      const temperature = p?.temperature ?? 1.25;
      const density = p?.density ?? 1;
      const width = gridRef.current[0]?.length || GRID_STEPS;
      const grid = blankGrid(width);
      let seedNotes: SeqNote[] = [{ pitch: 36, quantizedStartStep: 0, quantizedEndStep: 1, isDrum: true }];
      let seedSteps = 1;
      for (let off = 0; off < width; off += STEPS) {
        const notes = await genBlock(rnn, seedNotes, seedSteps, temperature, density);
        writeNotes(grid, notes, off);
        seedNotes = sliceNotes(grid, off);
        seedSteps = STEPS;
      }
      setGrid(grid);
      setStyle(describeGrid(grid, p?.style));   // prefix with the live style names
    } catch (err) { console.error(err); }
  }, []);
  regenRef.current = regenerate;

  // Prompt → params (keyword rules) → set BPM + generate a matching groove.
  const toggleStyle = (label: string) =>
    setStyleSels((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));

  const generateFromStyle = async () => {
    const params = stylesToParams(styleSels);
    regenParamsRef.current = params;   // auto-regen reuses these
    setBpm(params.bpm);
    setStyle(params.style);
    await generate(false, params);
  };

  // --- Advanced AI: Sample fresh beats (MusicVAE, 2-bar) ---
  const runExtra = async (label: string, fn: () => Promise<void>) => {
    setAi("thinking");
    setStyle(`${label}…`);
    try { await fn(); setAi("ready"); }
    catch (err) { console.error(err); setStyle(`⚠ ${label} failed`); setAi("idle"); }
  };

  const doSample = () => runExtra("Sampling", async () => {
    setSamples(await sampleBeats(4));
    setStyle("sampled 4 beats — click one to load");
  });

  const loadSample = (g: Grid) => { setGrid(g.map((r) => [...r])); setStyle(describeGrid(g, "sample")); };

  const aiLabel =
    ai === "loading" ? "Loading AI…" : ai === "thinking" ? "Thinking…" : "✨ Generate";
  const busy = ai === "loading" || ai === "thinking";

  return (
    <section className="seq">
      <div className="seq__head">
        <h2 className="seq__title">AI Step Sequencer</h2>
        <span className="seq__sub">Magenta drum model — runs in your browser</span>
      </div>

      <div className="seq__prompt">
        <div className="seq__styles" role="group" aria-label="Beat styles">
          {STYLES.map((s) => (
            <button
              key={s.label}
              type="button"
              className={"seq__chip" + (styleSels.includes(s.label) ? " is-on" : "")}
              onClick={() => toggleStyle(s.label)}
              disabled={busy}
              aria-pressed={styleSels.includes(s.label)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="seq__btn seq__btn--play" onClick={generateFromStyle} disabled={busy}>
          {busy ? aiLabel : "✨ From styles"}
        </button>
      </div>

      <div className="seq__transport">
        <button className="seq__btn seq__btn--play" onClick={togglePlay}>
          {playing ? "■ Stop" : "▶ Play"}
        </button>
        <label className="seq__bpm">
          BPM
          <input
            type="range" min={60} max={180} value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10))}
          />
          <span>{bpm}</span>
        </label>
        <label className="seq__bars">
          Bars
          <input
            type="number" min={1} max={16} value={bars}
            onChange={(e) => setBars(Math.max(1, Math.min(16, parseInt(e.target.value, 10) || 1)))}
            disabled={busy}
          />
        </label>
        <label className="seq__bars" title="Regenerate the pattern every N bars while playing (0 = off)">
          Auto-regen
          <input
            type="number" min={0} max={64} value={autoRegen}
            onChange={(e) => setAutoRegen(Math.max(0, Math.min(64, parseInt(e.target.value, 10) || 0)))}
          />
        </label>
        <button className="seq__btn" onClick={() => generate(false)} disabled={busy}>{aiLabel}</button>
        <button className="seq__btn" onClick={() => generate(true)} disabled={busy}>↳ Continue</button>
        <button className="seq__btn" onClick={clear} disabled={busy}>Clear</button>
      </div>

      {style && <p className="seq__status">{style}</p>}

      <div className="seq__panel">
        <button className="seq__panel-head" onClick={() => setAdvOpen((o) => !o)} aria-expanded={advOpen}>
          <span className="seq__caret">{advOpen ? "▼" : "▶"}</span>
          <b>Advanced AI</b>
          <span className="seq__badge">Magenta</span>
        </button>

        {advOpen && (
          <div className="seq__panel-body">
            {/* Sample (MusicVAE) */}
            <div className="seq__adv-block">
              <div className="seq__adv-top">
                <span className="seq__adv-name">Sample</span>
                <span className="seq__adv-hint">MusicVAE · four fresh beats — click to load</span>
              </div>
              <div className="seq__adv-row">
                <button className="seq__btn" onClick={doSample} disabled={busy}>✨ Sample 4</button>
                <div className="seq__samples">
                  {samples.map((g, i) => (
                    <button key={i} className="seq__sample" onClick={() => loadSample(g)} disabled={busy} aria-label={`Load sample ${i + 1}`}>
                      {[0, 1, 2].map((ti) => (
                        <div className="seq__sample-row" key={ti}>
                          {g[ti].slice(0, 16).map((v, s) => <span key={s} className={"seq__sample-dot" + (v ? " on" : "")} />)}
                        </div>
                      ))}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="seq__grid" style={{ ["--steps" as string]: grid[0]?.length ?? GRID_STEPS }}>
        {TRACKS.map((track, ti) => (
          <div className="seq__row" key={track.name}>
            <span className="seq__label">{track.name}</span>
            <div className="seq__cells">
              {grid[ti].map((vel, s) => (
                <button
                  key={s}
                  className={
                    "seq__cell" +
                    (vel ? " is-on" : "") +
                    (step === s ? " is-head" : "") +
                    (s % 4 === 0 ? " is-beat" : "")
                  }
                  style={vel ? { ["--vel" as string]: vel } : undefined}
                  onClick={() => toggle(ti, s)}
                  aria-label={`${track.name} step ${s + 1}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
