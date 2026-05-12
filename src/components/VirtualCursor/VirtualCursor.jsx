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
    <div className="pointer-events-none fixed inset-0 z-[42]" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-[0.92]" />
      <div ref={coreRef} className="emotionx-vcursor-core absolute left-0 top-0 opacity-0">
        <div className="emotionx-vcursor-aura pointer-events-none absolute inset-0 rounded-full" />
        <div className="emotionx-vcursor-ripple pointer-events-none" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-100 to-violet-200 shadow-[0_0_16px_rgba(34,211,238,0.9),0_0_32px_rgba(167,139,250,0.35)]" />
        <div className="emotionx-vcursor-ring pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 rounded-full border" />
      </div>
    </div>
  );
}
