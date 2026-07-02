'use client';
import { useState, useRef, useEffect, useCallback } from "react";
import { playDrum, warmUpAudio, TRACKS, type Track } from "./drumSynth";
import Sequencer from "./Sequencer";
import "./DrumMachine.css";

// Pads share the sequencer's 9 drums (same names, order, sounds, keys).
const KITS = TRACKS;

const DrumMachine = () => {
  const [label, setLabel] = useState("—");
  const [volume, setVolume] = useState(100);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const flashRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;

  const hit = useCallback((kit: Track) => {
    playDrum(kit.type, volumeRef.current / 100); // pads follow the volume slider

    setLabel(kit.name);
    setActiveKey(kit.key);
    if (flashRef.current) clearTimeout(flashRef.current);
    flashRef.current = setTimeout(() => setActiveKey(null), 140);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      const kit = KITS.find((x) => x.key === k);
      if (kit) hit(kit);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hit]);

  // Resume the audio context on the first user gesture so the first pad hit is
  // already at full volume (the context starts suspended until then).
  useEffect(() => {
    const wake = () => warmUpAudio();
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("keydown", wake, { once: true });
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  return (
    <div className="dm-page">

      <main className="dm-main">
        <div className="dm-titleblock">
          <p className="dm-kicker">React · Web Audio</p>
          <h1 className="dm-title">Drum Machine</h1>
        </div>

        <div className="volume-bar">
          <span className="volume-label">Volume</span>
          <input
            type="range" min="0" max="100" value={volume}
            onInput={(e) => setVolume(parseInt((e.target as HTMLInputElement).value, 10))}
            onChange={(e) => setVolume(parseInt(e.target.value, 10))}
          />
          <span className="volume-value">{volume}</span>
        </div>

        <Sequencer volume={volume} />

        <div className="dm-device">
          <div className="dm-readout">
            <span className="dm-readout-label">Pad</span>
            <span className="dm-readout-value">{label}</span>
          </div>

          <div className="dm-pads">
            {KITS.map((kit) => {
              const active = activeKey === kit.key;
              return (
                <button
                  key={kit.key}
                  className={"dm-pad" + (active ? " dm-pad--active" : "")}
                  onClick={() => hit(kit)}
                >
                  <span className="dm-pad-key">{kit.key}</span>
                  <span className="dm-pad-name">{kit.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="dm-tip">Tap a pad or use the Q-W-E / A-S-D / Z-X-C keys.</p>
      </main>
    </div>
  );
};

export default DrumMachine;
