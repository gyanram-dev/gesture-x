import { useEffect, useRef } from 'react';

const EMOTION_COLORS = {
  happy: '#34d399',
  sad: '#60a5fa',
  angry: '#f87171',
  surprised: '#fbbf24',
  fearful: '#c084fc',
  disgusted: '#a3e635',
  neutral: '#94a3b8',
};

function drawFaceBox(ctx, x, y, w, h, color, pulse) {
  const glow = 14 + pulse * 10;
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `${color}55`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
  ctx.restore();
}

function drawLabel(ctx, text, x, y, w, h, color) {
  const paddingX = 10;
  const paddingY = 6;
  ctx.font = '600 13px system-ui, Segoe UI, sans-serif';
  const metrics = ctx.measureText(text);
  const boxW = metrics.width + paddingX * 2;
  const boxH = 26;
  const lx = x;
  const ly = y > boxH + 12 ? y - boxH - 8 : y + h + 10;

  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.strokeStyle = `${color}66`;
  ctx.lineWidth = 1;
  const r = 10;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(lx, ly, boxW, boxH, r);
  } else {
    ctx.rect(lx, ly, boxW, boxH);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, lx + paddingX, ly + boxH - paddingY - 2);

  ctx.fillStyle = color;
  ctx.fillRect(lx + paddingX, ly + boxH - 4, boxW - paddingX * 2, 3);
}

export function EmotionOverlay({ videoRef, facesRef, stream }) {
  const canvasRef = useRef(null);

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
      const pulse = (Math.sin(performance.now() / 320) + 1) / 2;

      faces.forEach((face) => {
        const box = face.detection.box;
        const x = (vw - box.x - box.width) * sx;
        const y = box.y * sy;
        const w = box.width * sx;
        const h = box.height * sy;

        const sorted = Object.entries(face.expressions).sort((a, b) => b[1] - a[1]);
        const top = sorted[0];
        const emotionKey = top?.[0] ?? 'neutral';
        const label = top
          ? `${emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1)} · ${(top[1] * 100).toFixed(0)}%`
          : '';

        const color = EMOTION_COLORS[emotionKey] || EMOTION_COLORS.neutral;
        drawFaceBox(ctx, x, y, w, h, color, pulse);
        if (label) drawLabel(ctx, label, x, y, w, h, color);
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
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
