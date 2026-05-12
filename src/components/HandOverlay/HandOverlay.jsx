import { useEffect, useRef } from 'react';

/** MediaPipe hand skeleton topology (matches @mediapipe/hands). */
const HAND_CONNECTIONS = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];

const LINE = 'rgba(34, 211, 238, 0.55)';
const LINE_GLOW = 'rgba(34, 211, 238, 0.35)';
const NODE_CORE = '#ecfeff';
const NODE_HALO = 'rgba(56, 189, 248, 0.85)';

function drawHand(ctx, landmarks, width, height, pulse) {
  const toXY = (lm) => [lm.x * width, lm.y * height];

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [a, b] of HAND_CONNECTIONS) {
    const p0 = landmarks[a];
    const p1 = landmarks[b];
    if (!p0 || !p1) continue;
    const [x0, y0] = toXY(p0);
    const [x1, y1] = toXY(p1);

    ctx.strokeStyle = LINE_GLOW;
    ctx.lineWidth = 5 + pulse * 2;
    ctx.shadowColor = 'rgba(34, 211, 238, 0.45)';
    ctx.shadowBlur = 12 + pulse * 6;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  for (const lm of landmarks) {
    const [x, y] = toXY(lm);
    ctx.fillStyle = NODE_HALO;
    ctx.beginPath();
    ctx.arc(x, y, 5 + pulse * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = NODE_CORE;
    ctx.beginPath();
    ctx.arc(x, y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function HandOverlay({ videoRef, resultsRef, stream }) {
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const res = resultsRef?.current;
      const hands = res?.multiHandLandmarks;
      if (hands?.length) {
        const pulse = (Math.sin(performance.now() / 280) + 1) / 2;
        for (const landmarks of hands) {
          drawHand(ctx, landmarks, canvas.width, canvas.height, pulse);
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [videoRef, resultsRef, stream]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[24] h-full w-full"
      aria-hidden
    />
  );
}
