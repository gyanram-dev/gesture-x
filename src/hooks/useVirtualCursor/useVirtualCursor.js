import { useEffect, useRef } from 'react';

const INDEX_TIP = 8;
const THUMB_TIP = 4;
const TRAIL_MAX = 28;
const PARTICLE_BURST = 14;

function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function useVirtualCursor(
  videoRef,
  resultsRef,
  {
    enabled = true,
    canvasRef,
    coreRef,
    sensitivity = 1.12,
    smoothing = 0.22,
    pinchThreshold = 0.05,
    pinchRelease = 1.22,
    pinchHoverFactor = 1.34,
  } = {},
) {
  const stateRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    visible: false,
    pinchActive: false,
    pinchHover: false,
    pinchHeld: false,
    clickPulse: 0,
    trail: [],
    particles: [],
  });

  useEffect(() => {
    if (!enabled) {
      const s = stateRef.current;
      s.visible = false;
      s.particles = [];
      const el = coreRef?.current;
      if (el) el.style.opacity = '0';
      const cvs = canvasRef?.current;
      if (cvs) {
        const ctx = cvs.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, cvs.width, cvs.height);
      }
      return undefined;
    }

    let running = true;
    let raf = 0;

    const syncCanvasSize = (cvs) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (cvs && (cvs.width !== w || cvs.height !== h)) {
        cvs.width = w;
        cvs.height = h;
      }
    };

    const drawFx = (ctx, s) => {
      const w = ctx.canvas.width;
      const h = ctx.canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < s.trail.length; i += 1) {
        const p = s.trail[i];
        const t = 1 - i / s.trail.length;
        const a = t * 0.2;
        ctx.beginPath();
        ctx.fillStyle = `rgba(103, 232, 249, ${a})`;
        ctx.arc(p.x, p.y, 2 + t * 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = s.particles.length - 1; i >= 0; i -= 1) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 0.028;
        if (p.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 121, 249, ${p.life * 0.65})`;
        ctx.arc(p.x, p.y, 1.9 * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      if (s.clickPulse > 0.04) {
        const r = 18 + (1 - s.clickPulse) * 55;
        ctx.save();
        ctx.strokeStyle = `rgba(34, 211, 238, ${s.clickPulse * 0.55})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(167, 139, 250, 0.45)';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    };

    const o = {
      sensitivity,
      smoothing,
      pinchThreshold,
      pinchRelease,
      pinchHoverFactor,
    };

    const loop = () => {
      if (!running) return;

      const video = videoRef?.current;
      const res = resultsRef?.current;
      const lm = res?.multiHandLandmarks?.[0];
      const s = stateRef.current;
      const cvs = canvasRef?.current;
      const core = coreRef?.current;

      s.clickPulse *= 0.88;

      if (cvs) syncCanvasSize(cvs);
      const ctx = cvs?.getContext('2d');

      if (
        !video ||
        !lm?.[INDEX_TIP] ||
        !lm?.[THUMB_TIP] ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        s.visible = false;
        s.pinchHeld = false;
        s.pinchActive = false;
        s.pinchHover = false;
        if (core) core.style.opacity = '0';
        if (ctx) drawFx(ctx, s);
        raf = requestAnimationFrame(loop);
        return;
      }

      const rect = video.getBoundingClientRect();
      const tip = lm[INDEX_TIP];
      const thumb = lm[THUMB_TIP];

      let nx = 0.5 + (tip.x - 0.5) * o.sensitivity;
      let ny = 0.5 + (tip.y - 0.5) * o.sensitivity;
      nx = clamp01(nx);
      ny = clamp01(ny);

      const tx = rect.left + nx * rect.width;
      const ty = rect.top + ny * rect.height;

      s.x += (tx - s.x) * o.smoothing;
      s.y += (ty - s.y) * o.smoothing;

      const d = Math.hypot(thumb.x - tip.x, thumb.y - tip.y);
      s.pinchHover = d < o.pinchThreshold * o.pinchHoverFactor;

      const wasHeld = s.pinchHeld;
      let isHeld = wasHeld;
      if (!wasHeld && d < o.pinchThreshold) isHeld = true;
      else if (wasHeld && d > o.pinchThreshold * o.pinchRelease) isHeld = false;

      if (isHeld && !wasHeld) {
        s.clickPulse = 1;
        for (let i = 0; i < PARTICLE_BURST; i += 1) {
          const a = (Math.PI * 2 * i) / PARTICLE_BURST + Math.random() * 0.4;
          const sp = 1.8 + Math.random() * 2.2;
          s.particles.push({
            x: s.x,
            y: s.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 1,
          });
        }
      }
      s.pinchHeld = isHeld;
      s.pinchActive = isHeld;

      s.visible = true;

      s.trail.unshift({ x: s.x, y: s.y });
      if (s.trail.length > TRAIL_MAX) s.trail.length = TRAIL_MAX;

      if (core) {
        core.style.opacity = '1';
        core.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) translate(-50%, -50%) scale(${s.pinchActive ? 0.92 : s.pinchHover ? 1.08 : 1})`;
      }

      if (ctx) drawFx(ctx, s);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [
    enabled,
    videoRef,
    resultsRef,
    canvasRef,
    coreRef,
    sensitivity,
    smoothing,
    pinchThreshold,
    pinchRelease,
    pinchHoverFactor,
  ]);
}
