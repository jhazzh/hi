'use client';
import { useState, useRef, useEffect, useCallback } from "react";
import "./Pomodoro.scss";

const R = 104;
const C = 2 * Math.PI * R;

type Phase = "work" | "break";

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const Pomodoro = () => {
  const [phase, setPhase] = useState<Phase>("work");
  const [workMin, setWorkMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chime = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext!;
      const ctx = new Ctx();
      [660, 880].forEach((f, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const t = ctx.currentTime + i * 0.18;
        o.frequency.value = f; o.type = "sine";
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.5);
      });
    } catch (e) { /* audio unsupported */ }
  }, []);

  // Latest values for the interval tick without re-subscribing each second.
  const ref = useRef<{ phase: Phase; workMin: number; breakMin: number }>({ phase, workMin, breakMin });
  ref.current = { phase, workMin, breakMin };

  const tick = useCallback(() => {
    setRemaining((rem) => {
      if (rem <= 1) {
        chime();
        const { phase: p, workMin: w, breakMin: b } = ref.current;
        const next = p === "work" ? "break" : "work";
        setPhase(next);
        return (next === "work" ? w : b) * 60;
      }
      return rem - 1;
    });
  }, [chime]);

  const stop = useCallback(() => {
    if (ivRef.current) clearInterval(ivRef.current);
    ivRef.current = null;
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    if (ivRef.current) return;
    ivRef.current = setInterval(tick, 1000);
    setRunning(true);
  }, [tick]);

  const toggle = () => (running ? stop() : start());

  const reset = () => {
    stop();
    setRemaining((phase === "work" ? workMin : breakMin) * 60);
  };

  const switchPhase = (p: Phase) => {
    stop();
    setPhase(p);
    setRemaining((p === "work" ? workMin : breakMin) * 60);
  };

  const adjust = (which: Phase, delta: number) => {
    const setter = which === "work" ? setWorkMin : setBreakMin;
    setter((v) => {
      const nv = Math.min(60, Math.max(1, v + delta));
      if (phase === which && !running) setRemaining(nv * 60);
      return nv;
    });
  };

  useEffect(() => () => { if (ivRef.current) clearInterval(ivRef.current); }, []);

  const total = (phase === "work" ? workMin : breakMin) * 60;
  const frac = total > 0 ? remaining / total : 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  const tabClass = (p: Phase) => "pomo-tab" + (phase === p ? " pomo-tab--active" : "");

  return (
    <div className="pomo-page">

      <main className="pomo-main">
        <div className="pomo-titleblock">
          <p className="pomo-kicker">React · Timers</p>
          <h1 className="pomo-title">Pomodoro</h1>
        </div>

        <div className="pomo-card">
          <div className="pomo-tabs">
            <button className={tabClass("work")} onClick={() => switchPhase("work")}>Focus</button>
            <button className={tabClass("break")} onClick={() => switchPhase("break")}>Break</button>
          </div>

          <div className="pomo-dial">
            <svg width="232" height="232" viewBox="0 0 232 232" className="pomo-ring">
              <circle cx="116" cy="116" r={R} fill="none" stroke="#EFEBE2" strokeWidth="10" />
              <circle
                cx="116" cy="116" r={R} fill="none"
                stroke="oklch(0.56 0.13 256)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
                className="pomo-progress"
              />
            </svg>
            <div className="pomo-dial-center">
              <div className="pomo-time">{mm}:{ss}</div>
              <div className="pomo-phase">{phase === "work" ? "Focus" : "Break"}</div>
            </div>
          </div>

          <div className="pomo-controls">
            <button className="pomo-play" onClick={toggle}>{running ? "Pause" : "Start"}</button>
            <button className="pomo-reset" onClick={reset}>Reset</button>
          </div>

          <div className="pomo-settings">
            <div className="pomo-setting">
              <div className="pomo-setting-label">Focus min</div>
              <div className="pomo-stepper">
                <button onClick={() => adjust("work", -1)}>−</button>
                <span>{workMin}</span>
                <button onClick={() => adjust("work", 1)}>+</button>
              </div>
            </div>
            <div className="pomo-divider" />
            <div className="pomo-setting">
              <div className="pomo-setting-label">Break min</div>
              <div className="pomo-stepper">
                <button onClick={() => adjust("break", -1)}>−</button>
                <span>{breakMin}</span>
                <button onClick={() => adjust("break", 1)}>+</button>
              </div>
            </div>
          </div>
        </div>

        <p className="pomo-tip">A soft chime plays when each session ends.</p>
      </main>
    </div>
  );
};

export default Pomodoro;