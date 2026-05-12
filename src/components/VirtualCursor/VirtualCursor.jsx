import { useRef } from 'react';
import { useVirtualCursor } from '../../hooks/useVirtualCursor';

export function VirtualCursor({ videoRef, resultsRef, enabled = true }) {
  const canvasRef = useRef(null);
  const coreRef = useRef(null);

  useVirtualCursor(videoRef, resultsRef, {
    enabled,
    canvasRef,
    coreRef,
    sensitivity: 1.14,
    smoothing: 0.2,
    pinchThreshold: 0.048,
    pinchRelease: 1.24,
    pinchHoverFactor: 1.36,
  });

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[42]"
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
      <div
        ref={coreRef}
        className="emotionx-vcursor-core absolute left-0 top-0 opacity-0"
      >
        <div className="emotionx-vcursor-aura pointer-events-none absolute inset-0 rounded-full" />
        <div className="emotionx-vcursor-dot pointer-events-none absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.95),0_0_28px_rgba(34,211,238,0.45)]" />
        <div className="emotionx-vcursor-ring pointer-events-none absolute left-1/2 top-1/2 h-9 w-9 rounded-full border border-cyan-400/35" />
      </div>
    </div>
  );
}
