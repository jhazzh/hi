'use client';
import { useState } from "react";
import "./ImageGenerator.scss";

type State = { skin: number; hair: number; hairColor: number; mood: number; bg: number };
type FeatureKey = keyof State;

const SKINS = ["#E8D8BE", "#D9B98C", "#B5895C", "#C9C3B8"];
const HAIRS = ["None", "Tuft", "Fringe", "Fluffy", "Mohawk"];
const HAIR_COLORS = ["#6B4226", "#A9885C", "#E0D2B4", "#3D3128", "#C9C3B8"];
const MOODS = ["Happy", "Neutral", "Wink", "Surprised"];
const BGS = ["oklch(0.92 0.04 256)", "oklch(0.92 0.04 150)", "oklch(0.93 0.045 70)", "oklch(0.92 0.04 20)", "#EFEBE2"];

const ACCENT = "oklch(0.56 0.13 256)";

const buildSvg = (state: State, size = 180) => {
  const skin = SKINS[state.skin];
  const hairCol = HAIR_COLORS[state.hairColor];
  const hair = HAIRS[state.hair];
  const mood = MOODS[state.mood];

  const muzzle = "#F1E7D6";
  const innerEar = "#E2B8A8";
  const hoof = "#9B6B53";

  const ears = `<path d="M80 52 Q68 14 84 12 Q93 30 91 54 Z" fill="${skin}"/>`
    + `<path d="M120 52 Q132 14 116 12 Q107 30 109 54 Z" fill="${skin}"/>`
    + `<path d="M84 46 Q77 22 86 20 Q91 32 90 46 Z" fill="${innerEar}"/>`
    + `<path d="M116 46 Q123 22 114 20 Q109 32 110 46 Z" fill="${innerEar}"/>`;

  const bodyEl = `<rect x="88" y="84" width="24" height="76" rx="12" fill="${skin}"/>`
    + `<ellipse cx="100" cy="196" rx="50" ry="48" fill="${skin}"/>`
    + `<ellipse cx="100" cy="204" rx="30" ry="26" fill="${muzzle}" opacity="0.45"/>`;

  const head = `<ellipse cx="100" cy="68" rx="28" ry="26" fill="${skin}"/>`
    + `<ellipse cx="100" cy="80" rx="16" ry="12" fill="${muzzle}"/>`
    + `<ellipse cx="95" cy="77" rx="1.9" ry="2.7" fill="${hoof}"/>`
    + `<ellipse cx="105" cy="77" rx="1.9" ry="2.7" fill="${hoof}"/>`;

  let tuftEl = "";
  if (hair === "Tuft") tuftEl = `<ellipse cx="100" cy="44" rx="13" ry="9" fill="${hairCol}"/>`;
  else if (hair === "Fringe") tuftEl = `<path d="M76 56 Q100 38 124 56 Q118 64 100 61 Q82 64 76 56 Z" fill="${hairCol}"/>`;
  else if (hair === "Fluffy") tuftEl = `<g fill="${hairCol}"><circle cx="89" cy="44" r="8.5"/><circle cx="100" cy="38" r="10"/><circle cx="111" cy="44" r="8.5"/></g>`;
  else if (hair === "Mohawk") tuftEl = `<path d="M95 26 Q100 18 105 26 L103 48 L97 48 Z" fill="${hairCol}"/>`;

  let eyes = `<circle cx="90" cy="63" r="4.2" fill="#2B2B2B"/><circle cx="110" cy="63" r="4.2" fill="#2B2B2B"/>`;
  if (mood === "Wink") eyes = `<circle cx="90" cy="63" r="4.2" fill="#2B2B2B"/><path d="M104 63 q6 -5 12 0" stroke="#2B2B2B" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  else if (mood === "Surprised") eyes = `<circle cx="90" cy="62" r="5.5" fill="#2B2B2B"/><circle cx="110" cy="62" r="5.5" fill="#2B2B2B"/>`;

  let mouth = `<path d="M94 84 q6 5 12 0" stroke="${hoof}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if (mood === "Neutral") mouth = `<path d="M95 85 h10" stroke="${hoof}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  else if (mood === "Surprised") mouth = `<ellipse cx="100" cy="86" rx="4" ry="5" fill="${hoof}"/>`;
  else if (mood === "Wink") mouth = `<path d="M92 83 q8 8 16 0" stroke="${hoof}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${ears}${bodyEl}${head}${tuftEl}${eyes}${mouth}</svg>`;
};

const AvatarGenerator = () => {
  const [state, setState] = useState<State>({ skin: 0, hair: 1, hairColor: 0, mood: 0, bg: 0 });
  const set = (key: FeatureKey, i: number) => setState((s) => ({ ...s, [key]: i }));

  const randomize = () => {
    const r = (n: number) => Math.floor(Math.random() * n);
    setState({ skin: r(4), hair: r(5), hairColor: r(5), mood: r(4), bg: r(5) });
  };

  const download = () => {
    const size = 480;
    const svg = buildSvg(state, size);
    const img = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const bgVal = BGS[state.bg];
      ctx.fillStyle = bgVal.startsWith("#") ? bgVal : "#EAEFF7";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(b);
        a.download = "avatar.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
    };
    img.src = url;
  };

  const Swatch = ({ colors, keyName, square }: { colors: string[]; keyName: FeatureKey; square?: boolean }) => (
    <div className="av-row">
      {colors.map((color, i) => (
        <button
          key={i}
          className={"av-swatch" + (square ? " av-swatch--sq" : "")}
          style={{
            background: color,
            borderColor: state[keyName] === i ? ACCENT : "transparent",
          }}
          onClick={() => set(keyName, i)}
          aria-label={`option ${i + 1}`}
        />
      ))}
    </div>
  );

  const Chips = ({ list, keyName }: { list: string[]; keyName: FeatureKey }) => (
    <div className="av-row av-row--wrap">
      {list.map((name, i) => (
        <button
          key={name}
          className={"av-chip" + (state[keyName] === i ? " av-chip--on" : "")}
          onClick={() => set(keyName, i)}
        >
          {name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="av-page">

      <main className="av-main">
        <div className="av-titleblock">
          <p className="av-kicker">React · SVG</p>
          <h1 className="av-title">Avatar Generator</h1>
        </div>

        <div className="av-grid">
          <div className="av-preview-card">
            <div className="av-stage" style={{ background: BGS[state.bg] }}>
              <div dangerouslySetInnerHTML={{ __html: buildSvg(state) }} />
            </div>
            <div className="av-actions">
              <button className="av-randomize" onClick={randomize}>Randomize</button>
              <button className="av-download" onClick={download}>Download</button>
            </div>
          </div>

          <div className="av-controls">
            <div className="av-control">
              <div className="av-label">Fur</div>
              <Swatch colors={SKINS} keyName="skin" />
            </div>
            <div className="av-control">
              <div className="av-label">Tuft</div>
              <Chips list={HAIRS} keyName="hair" />
            </div>
            <div className="av-control">
              <div className="av-label">Tuft color</div>
              <Swatch colors={HAIR_COLORS} keyName="hairColor" />
            </div>
            <div className="av-control">
              <div className="av-label">Expression</div>
              <Chips list={MOODS} keyName="mood" />
            </div>
            <div className="av-control">
              <div className="av-label">Background</div>
              <Swatch colors={BGS} keyName="bg" square />
            </div>
          </div>
        </div>

        <p className="av-tip">Mix the features, then download your avatar as a PNG.</p>
      </main>
    </div>
  );
};

export default AvatarGenerator;