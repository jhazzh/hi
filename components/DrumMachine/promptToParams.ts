// Keyword rules that turn a free-text prompt into drum-generation parameters.
// No model — a fast, reliable, keyless mapping. The params steer Magenta
// (temperature/density) and the transport (BPM, swing).

export type DrumParams = {
  bpm: number;
  swing: number;      // 0..0.6 — 16th-note shuffle amount
  density: number;    // 0..1 — chance a generated hit is kept
  temperature: number;// Magenta sampling temperature
  style: string;      // matched style label (for UI feedback)
};

const DEFAULTS: DrumParams = { bpm: 120, swing: 0, density: 1, temperature: 1.1, style: "default" };

// Each rule: keywords → partial params. First matches win; later ones layer on.
const RULES: { keys: string[]; label: string; p: Partial<DrumParams> }[] = [
  { keys: ["lofi", "lo-fi", "chill", "jazzy", "boom bap"], label: "lo-fi",
    p: { bpm: 82, swing: 0.35, density: 0.7, temperature: 1.0 } },
  { keys: ["hip hop", "hiphop", "trap", "rap"], label: "hip-hop",
    p: { bpm: 88, swing: 0.2, density: 0.75, temperature: 1.05 } },
  { keys: ["techno", "four on the floor", "4x4", "driving"], label: "techno",
    p: { bpm: 130, swing: 0, density: 0.9, temperature: 0.9 } },
  { keys: ["house", "disco", "groove", "funky"], label: "house",
    p: { bpm: 124, swing: 0.12, density: 0.85, temperature: 1.0 } },
  { keys: ["dnb", "drum and bass", "jungle", "breakbeat", "break"], label: "dnb",
    p: { bpm: 170, swing: 0.05, density: 1, temperature: 1.3 } },
  { keys: ["rock", "punk", "metal", "band"], label: "rock",
    p: { bpm: 140, swing: 0, density: 0.7, temperature: 0.85 } },
  { keys: ["ambient", "sparse", "minimal", "slow", "downtempo"], label: "minimal",
    p: { bpm: 90, swing: 0.1, density: 0.45, temperature: 1.1 } },
  { keys: ["busy", "fill", "chaotic", "complex", "fast"], label: "busy",
    p: { density: 1, temperature: 1.5 } },
];

/**
 * Map a text prompt to drum params via keyword rules.
 * @param prompt free text (e.g. "fast chaotic techno")
 * @return resolved DrumParams (defaults where nothing matched)
 */
export function promptToParams(prompt: string): DrumParams {
  const text = prompt.toLowerCase();
  const params: DrumParams = { ...DEFAULTS };
  const matched: string[] = [];

  for (const rule of RULES) {
    if (rule.keys.some((k) => text.includes(k))) {
      Object.assign(params, rule.p);
      matched.push(rule.label);
    }
  }

  // Explicit "NNN bpm" overrides any style tempo.
  const bpmMatch = text.match(/(\d{2,3})\s*bpm/);
  if (bpmMatch) params.bpm = Math.min(180, Math.max(60, parseInt(bpmMatch[1], 10)));

  params.style = matched.length ? matched.join(" + ") : "default";
  return params;
}

// The selectable styles (label + partial params) — derived from the same RULES,
// so the list and the mapping never drift apart.
export const STYLES: { label: string; p: Partial<DrumParams> }[] = RULES.map((r) => ({
  label: r.label,
  p: r.p,
}));

// Combine one or more chosen styles into params. Layered like the keyword rules:
// later selections override earlier ones (so "techno + busy" = techno tempo,
// busy density). Falls back to defaults when nothing is selected.
export function stylesToParams(labels: string[]): DrumParams {
  const params: DrumParams = { ...DEFAULTS };
  const matched: string[] = [];
  for (const s of STYLES) {
    if (labels.includes(s.label)) { Object.assign(params, s.p); matched.push(s.label); }
  }
  params.style = matched.length ? matched.join(" + ") : "default";
  return params;
}
