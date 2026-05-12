import { useEffect, useRef } from 'react';

const EMOTION_COLORS = {
  happy: '#2dd4bf',
  sad: '#38bdf8',
  angry: '#fb7185',
  surprised: '#fbbf24',
  fearful: '#c084fc',
  disgusted: '#a3e635',
  neutral: '#94a3b8',
};

const LERP = 0.22;

function drawCornerBrackets(ctx, x, y, w, h, len, color, glow, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.35;
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;

  const drawL = (sx, sy, dx, dy, ex, ey) => {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(dx, dy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  };

  drawL(x, y + len, x, y, x + len, y);
  drawL(x + w - len, y, x + w, y, x + w, y + len);
  drawL(x + w, y + h - len, x + w, y + h, x + w - len, y + h);
  drawL(x + len, y + h, x, y + h, x, y + h - len);

  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(255,255,255,${0.12 * alpha})`;
  ctx.lineWidth = 0.85;
  drawL(x, y + len, x, y, x + len, y);
  drawL(x + w - len, y, x + w, y, x + w, y + len);
  drawL(x + w, y + h - len, x + w, y + h, x + w - len, y + h);
  drawL(x + len, y + h, x, y + h, x, y + h - len);

  ctx.restore();
}

function drawScanLine(ctx, x, y, w, h, t, color) {
  const phase = (t * 0.0009) % 1;
  const scanY = y + 6 + (h - 12) * phase;
  const pad = Math.min(20, w * 0.08);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(x + pad, scanY);
  ctx.lineTo(x + w - pad, scanY);
  ctx.stroke();
  ctx.restore();
}

function drawHudLabel(ctx, text, cx, top, color) {
  ctx.save();
  ctx.font = '600 10px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  const metrics = ctx.measureText(text);
  const padX = 12;
  const padY = 5;
  const bw = metrics.width + padX * 2;
  const bh = 20;
  const lx = cx - bw / 2;
  const ly = top - bh - 6;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.55)';
  ctx.strokeStyle = `${color}44`;
  ctx.lineWidth = 1;
  const r = 6;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(lx, ly, bw, bh, r);
  } else {
    ctx.rect(lx, ly, bw, bh);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
  ctx.fillText(text, cx, ly + bh - padY - 1);

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.fillRect(lx + padX, ly + bh - 2, bw - padX * 2, 1.5);
  ctx.restore();
}

export function EmotionOverlay({ videoRef, facesRef, stream }) {
  const canvasRef = useRef(null);
  const smoothRef = useRef([]);
  const lastEmotionRef = useRef('');
  const emotionPulseRef = useRef(0);

  useEffect(() => {
    if (!stream) return;

    const canvas = canvasRef.current;
    const video = videoRef?.current;
    if (!canvas || !video) return;

    const syncSize = () => {
      const r = video.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width));
      const h = Math.max(1, Math.floor(r.height));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const ro = new ResizeObserver(() => syncSize());
    ro.observe(video);
    syncSize();

    let rafId = 0;

    const loop = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      syncSize();

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const cw = canvas.width;
      const ch = canvas.height;

      ctx.clearRect(0, 0, cw, ch);

      if (!vw || !vh) {
        rafId = requestAnimationFrame(loop);
        return;
      }

      const faces = facesRef.current ?? [];
      const sx = cw / vw;
      const sy = ch / vh;
      const t = performance.now();
      const breath = (Math.sin(t / 2200) + 1) * 0.5;

      while (smoothRef.current.length < faces.length) {
        smoothRef.current.push({ x: 0, y: 0, w: 0, h: 0 });
      }
      smoothRef.current.length = faces.length;

      faces.forEach((face, i) => {
        const box = face.detection.box;
        const tx = (vw - box.x - box.width) * sx;
        const ty = box.y * sy;
        const tw = box.width * sx;
        const th = box.height * sy;

        const s = smoothRef.current[i];
        if (s.w < 2 && tw > 2) {
          s.x = tx;
          s.y = ty;
          s.w = tw;
          s.h = th;
        } else {
          s.x += (tx - s.x) * LERP;
          s.y += (ty - s.y) * LERP;
          s.w += (tw - s.w) * LERP;
          s.h += (th - s.h) * LERP;
        }

        const sorted = Object.entries(face.expressions).sort((a, b) => b[1] - a[1]);
        const top = sorted[0];
        const emotionKey = top?.[0] ?? 'neutral';
        const label = top ? `${emotionKey.toUpperCase()} · ${(top[1] * 100).toFixed(0)}%` : '';

        const color = EMOTION_COLORS[emotionKey] || EMOTION_COLORS.neutral;

        if (i === 0) {
          if (emotionKey !== lastEmotionRef.current) {
            emotionPulseRef.current = 1;
            lastEmotionRef.current = emotionKey;
          }
          emotionPulseRef.current *= 0.88;
        }

        const isPrimary = i === 0;
        const emotionBoost = isPrimary ? emotionPulseRef.current : 0;
        const bracketLen = Math.min(32, Math.min(s.w, s.h) * 0.2);
        const glow = 6 + breath * 10 + emotionBoost * 28;
        const alpha = isPrimary ? 1 : 0.55;

        drawCornerBrackets(ctx, s.x, s.y, s.w, s.h, bracketLen, color, glow, alpha);

        if (isPrimary) {
          drawScanLine(ctx, s.x, s.y, s.w, s.h, t, color);
          if (label) {
            drawHudLabel(ctx, label, s.x + s.w / 2, s.y, color);
          }
        }
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      smoothRef.current = [];
      lastEmotionRef.current = '';
      emotionPulseRef.current = 0;
      const c = canvas.getContext('2d');
      if (c) c.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [videoRef, facesRef, stream]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[22] h-full w-full"
      aria-hidden
    />
  );
}
