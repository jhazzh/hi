'use client';
import { useEffect, useRef } from "react";
import "./NeonCircuit.css";

type Pt = { x: number; y: number };
type Seg = { a: Pt; b: Pt; len: number; start: number; glow: number };
type Path = {
  pts: Pt[]; segs: Seg[]; vias: Pt[]; total: number; endY: number;
  padTop: boolean; padBottom: boolean; nextSignal: number;
};
type Signal = { path: Path; dir: number; d: number; speed: number; life: number };

// Fires a burst of signals down the visible traces. Registered by the mounted
// canvas; a no-op when the neon theme is off or the canvas isn't mounted.
let surgeImpl: (() => void) | null = null;

export const circuitSurge = () => { surgeImpl?.(); };

const NEON = "57,255,139";
const COL = 38;                  // column pitch between traces
const INFLUENCE = 160;           // pointer glow radius
const JOG_CHANCE = 0.35;
const PARALLAX = 0.6;            // background scrolls slower than the page
const SCROLL_PER_SIGNAL = 120;
const MAX_SCROLL_SIGNALS = 6;
const SURGE_SIGNALS = 14;        // signals fired on a card click
const SURGE_SPEED = 9;

// Circuit-board background for the neon theme: traces glow near the pointer,
// and signals travel along them on a timer and as you scroll. The animation
// loop only runs while the neon theme is active.
const NeonCircuit = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, WORLD_H = 0;
    let paths: Path[] = [];
    let signals: Signal[] = [];
    let active = false;
    let rafId: number | null = null;
    const mouse = { x: -9999, y: -9999 };
    let scrollY = window.scrollY;

    const makePath = (colIndex: number, startY: number): Path => {
      let col = colIndex, x = col * COL + COL / 2, y = startY;
      const pts: Pt[] = [{ x, y }];
      const vias: Pt[] = [];
      const nRuns = 1 + Math.floor(Math.random() * 3);
      for (let r = 0; r < nRuns; r++) {
        y += 80 + Math.random() * 220;
        pts.push({ x, y });
        if (r < nRuns - 1 && Math.random() < JOG_CHANCE) {
          const dir = col <= 1 ? 1 : Math.random() < 0.5 ? -1 : 1;
          col += dir;
          const jog = COL * dir;
          x += jog;
          y += Math.abs(jog);
          pts.push({ x, y });
          if (Math.random() < 0.6) vias.push({ x, y });
        }
      }
      const segs: Seg[] = [];
      let total = 0;
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1];
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        segs.push({ a, b, len, start: total, glow: 0 });
        total += len;
      }
      return {
        pts, segs, vias, total, endY: y,
        padTop: Math.random() < 0.8,
        padBottom: Math.random() < 0.8,
        nextSignal: 2 + Math.random() * 10,
      };
    };

    const build = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
      WORLD_H = (docH - window.innerHeight) * PARALLAX + window.innerHeight;
      paths = [];
      signals = [];
      const nCols = Math.ceil(W / COL) + 2;
      for (let i = 0; i < nCols; i++) {
        let y = -30 - Math.random() * 120;
        while (y < WORLD_H) {
          const p = makePath(i, y);
          paths.push(p);
          y = p.endY + 26 + Math.random() * 70;
        }
      }
    };

    const offset = () => scrollY * PARALLAX;

    const addSignal = (path: Path, dir?: number, speed?: number) => {
      const d = dir || (Math.random() < 0.5 ? 1 : -1);
      signals.push({
        path, dir: d,
        d: d === 1 ? 0 : path.total,
        speed: speed || 3 + Math.random() * 4,
        life: 1,
      });
    };

    const pointAt = (path: Path, d: number): Pt => {
      for (const s of path.segs) {
        if (d <= s.start + s.len) {
          const t = (d - s.start) / s.len;
          return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
        }
      }
      return path.pts[path.pts.length - 1];
    };

    const segDist = (px: number, py: number, s: Seg) => {
      const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
      const t = Math.max(0, Math.min(1,
        ((px - s.a.x) * dx + (py - s.a.y) * dy) / (s.len * s.len || 1)));
      return Math.hypot(px - (s.a.x + dx * t), py - (s.a.y + dy * t));
    };

    const drawPad = (x: number, y: number, glow: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${NEON},${0.18 + glow * 0.75})`;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = glow > 0.1 ? `rgba(${NEON},${glow})` : "transparent";
      ctx.shadowBlur = glow * 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawVia = (x: number, y: number) => {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${NEON},0.3)`;
      ctx.fill();
    };

    const frame = () => {
      if (!active) { rafId = null; return; }
      ctx.clearRect(0, 0, W, H);

      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, "rgba(6,50,28,0.5)");
      g.addColorStop(1, "rgba(3,15,8,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const off = offset();
      const mWX = mouse.x;
      const mWY = mouse.y > -999 ? mouse.y + off : -9999;

      if (!reduceMotion) {
        for (const p of paths) {
          if (p.endY < off - 200 || p.pts[0].y > off + H + 200) continue;
          p.nextSignal -= 0.016;
          if (p.nextSignal <= 0) { addSignal(p); p.nextSignal = 5 + Math.random() * 12; }
        }
      }

      ctx.save();
      ctx.translate(0, -off);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      for (const p of paths) {
        if (p.endY < off - 60 || p.pts[0].y > off + H + 60) continue;
        for (const s of p.segs) {
          let target = 0;
          const d = segDist(mWX, mWY, s);
          if (d < INFLUENCE) target = 1 - d / INFLUENCE;
          s.glow += (target - s.glow) * 0.12;
          const glow = s.glow;
          ctx.lineWidth = 1 + glow * 1.2;
          ctx.strokeStyle = `rgba(${NEON},${0.1 + glow * 0.8})`;
          ctx.shadowColor = glow > 0.1 ? `rgba(${NEON},${glow})` : "transparent";
          ctx.shadowBlur = glow * 18;
          ctx.beginPath();
          ctx.moveTo(s.a.x, s.a.y);
          ctx.lineTo(s.b.x, s.b.y);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
        if (p.padTop) drawPad(p.pts[0].x, p.pts[0].y, p.segs[0].glow);
        if (p.padBottom) {
          drawPad(p.pts[p.pts.length - 1].x, p.pts[p.pts.length - 1].y, p.segs[p.segs.length - 1].glow);
        }
        for (const v of p.vias) drawVia(v.x, v.y);
      }

      for (let i = signals.length - 1; i >= 0; i--) {
        const s = signals[i];
        s.d += s.speed * s.dir;
        if (s.d < 0 || s.d > s.path.total) s.life -= 0.2;
        if (s.life <= 0) { signals.splice(i, 1); continue; }
        const clamp = (v: number) => Math.max(0, Math.min(s.path.total, v));
        const head = pointAt(s.path, clamp(s.d));
        const tail = pointAt(s.path, clamp(s.d - 26 * s.dir));
        const grad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
        grad.addColorStop(0, `rgba(${NEON},0)`);
        grad.addColorStop(1, `rgba(${NEON},${0.9 * s.life})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tail.x, tail.y);
        ctx.lineTo(head.x, head.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(head.x, head.y, 2.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,255,242,${s.life})`;
        ctx.shadowColor = `rgba(${NEON},${s.life})`;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      rafId = requestAnimationFrame(frame);
    };

    const setActive = (on: boolean) => {
      if (on === active) return;
      active = on;
      if (on && rafId === null) rafId = requestAnimationFrame(frame);
      if (!on) ctx.clearRect(0, 0, W, H);
    };

    const onPointerMove = (e: PointerEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onPointerLeave = () => { mouse.x = mouse.y = -9999; };

    let lastScroll = window.scrollY;
    let scrollBank = 0;
    const onScroll = () => {
      scrollY = window.scrollY;
      const delta = scrollY - lastScroll;
      lastScroll = scrollY;
      if (reduceMotion || !active) return;
      scrollBank += Math.abs(delta);
      let fired = 0;
      while (scrollBank >= SCROLL_PER_SIGNAL && fired < MAX_SCROLL_SIGNALS) {
        scrollBank -= SCROLL_PER_SIGNAL;
        const visible = paths.filter(
          (p) => p.endY > offset() - 100 && p.pts[0].y < offset() + H + 100);
        if (visible.length) {
          addSignal(visible[Math.floor(Math.random() * visible.length)],
            delta > 0 ? 1 : -1, 5 + Math.random() * 4);
        }
        fired++;
      }
      scrollBank = Math.min(scrollBank, SCROLL_PER_SIGNAL);
    };

    build();
    window.addEventListener("resize", build);
    const ro = new ResizeObserver(build);
    ro.observe(document.body);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    // Follow the theme: run only while data-theme is neon.
    const root = document.documentElement;
    const sync = () => setActive(root.getAttribute("data-theme") === "neon");
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    // Burst of downward signals along the traces in view.
    surgeImpl = () => {
      if (!active || reduceMotion) return;
      const off = offset();
      const visible = paths.filter(
        (p) => p.endY > off - 100 && p.pts[0].y < off + H + 100);
      if (!visible.length) return;
      for (let i = 0; i < SURGE_SIGNALS; i++) {
        const p = visible[Math.floor(Math.random() * visible.length)];
        addSignal(p, 1, SURGE_SPEED + Math.random() * 4);
      }
    };

    return () => {
      active = false;
      surgeImpl = null;
      if (rafId !== null) cancelAnimationFrame(rafId);
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="neon-bg" aria-hidden="true" />
      <div className="neon-vignette" aria-hidden="true" />
    </>
  );
};

export default NeonCircuit;
