const EMOTION_COLORS = {
  happy: '#34d399',
  sad: '#60a5fa',
  angry: '#f87171',
  surprised: '#fbbf24',
  fearful: '#c084fc',
  disgusted: '#a3e635',
  neutral: '#94a3b8',
};

const ORDER = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];

export function EmotionCard({ hud }) {
  const dominant = hud?.emotion ?? null;
  const confidencePct = hud ? Math.round(hud.confidence * 1000) / 10 : 0;
  const expressions = hud?.expressions ?? null;

  const rows = expressions
    ? ORDER.map((key) => [key, expressions[key] ?? 0]).filter(([, v]) => typeof v === 'number')
    : [];

  return (
    <aside className="emotionx-card pointer-events-none fixed bottom-6 left-6 z-20 w-[min(92vw,320px)] rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4 shadow-[0_0_40px_rgba(34,211,238,0.12)] backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/80">
          Affective core
        </span>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
      </div>

      {!hud ? (
        <p className="text-sm text-slate-400">Align your face in frame…</p>
      ) : (
        <>
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Dominant</p>
              <p
                className="text-2xl font-semibold capitalize tracking-tight"
                style={{ color: EMOTION_COLORS[dominant] ?? EMOTION_COLORS.neutral }}
              >
                {dominant}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-widest text-slate-500">Confidence</p>
              <p className="text-xl font-semibold tabular-nums text-slate-100">{confidencePct}%</p>
            </div>
          </div>

          <div className="emotionx-confidence-track mb-4 h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className="emotionx-confidence-fill h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, confidencePct))}%`,
                background: `linear-gradient(90deg, ${EMOTION_COLORS[dominant] ?? EMOTION_COLORS.neutral}, #22d3ee)`,
                boxShadow: `0 0 18px ${EMOTION_COLORS[dominant] ?? '#22d3ee'}55`,
              }}
            />
          </div>

          <ul className="space-y-2">
            {rows.map(([emotion, value]) => (
              <li key={emotion}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                  <span className="capitalize" style={{ color: EMOTION_COLORS[emotion] ?? '#cbd5f5' }}>
                    {emotion}
                  </span>
                  <span className="tabular-nums text-slate-400">{(value * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="emotionx-mini-bar h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, value * 100))}%`,
                      backgroundColor: EMOTION_COLORS[emotion] ?? '#64748b',
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
