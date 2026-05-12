const EMOTION_COLORS = {
  happy: '#2dd4bf',
  sad: '#38bdf8',
  angry: '#fb7185',
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

  const accent = EMOTION_COLORS[dominant] ?? EMOTION_COLORS.neutral;

  return (
    <aside
      className="emotionx-glass-panel pointer-events-none fixed bottom-8 left-4 z-[28] w-[min(calc(100vw-2rem),300px)] rounded-2xl p-5 md:bottom-10 md:left-8 md:w-[min(92vw,300px)] md:rounded-3xl md:p-6"
      style={{
        borderColor: 'rgba(34, 211, 238, 0.14)',
      }}
    >
      <div className="mb-5 flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div>
          <p className="emotionx-micro text-[0.65rem] tracking-[0.26em] text-cyan-200/70">
            Affective vector
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Primary readout</p>
        </div>
        <div
          className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
          style={{
            background: accent,
            boxShadow: `0 0 14px ${accent}, 0 0 28px rgba(34,211,238,0.25)`,
          }}
        />
      </div>

      {!hud ? (
        <p className="text-sm leading-relaxed text-slate-500">Center in frame to initialize lock…</p>
      ) : (
        <>
          <div className="mb-1 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="emotionx-micro mb-1 text-[0.58rem] text-slate-500">Dominant</p>
              <p
                className="truncate text-3xl font-semibold capitalize leading-none tracking-tight md:text-[2.15rem]"
                style={{
                  color: accent,
                  textShadow: `0 0 40px ${accent}33`,
                }}
              >
                {dominant}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="emotionx-micro mb-1 text-[0.58rem] text-slate-500">Signal</p>
              <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-50 md:text-[1.85rem]">
                {confidencePct}
                <span className="text-lg font-medium text-slate-500">%</span>
              </p>
            </div>
          </div>

          <div className="emotionx-confidence-bar mb-6 mt-4 h-[3px] overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="emotionx-confidence-fill h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, confidencePct))}%`,
                background: `linear-gradient(90deg, ${accent}dd, var(--ex-cyan) 85%, var(--ex-violet) 120%)`,
                boxShadow: `0 0 20px ${accent}44`,
              }}
            />
          </div>

          <p className="emotionx-micro mb-3 text-[0.58rem] text-slate-500">Distribution</p>
          <ul className="max-h-[min(40vh,220px)] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
            {rows.map(([emotion, value]) => (
              <li key={emotion} className="group">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span
                    className="text-[11px] font-medium capitalize tracking-wide text-slate-400 transition-colors group-hover:text-slate-200"
                    style={{ color: EMOTION_COLORS[emotion] ?? undefined }}
                  >
                    {emotion}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    {(value * 100).toFixed(0)}
                    <span className="text-slate-600">%</span>
                  </span>
                </div>
                <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="emotionx-mini-bar h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, value * 100))}%`,
                      background: `linear-gradient(90deg, ${EMOTION_COLORS[emotion] ?? '#64748b'}cc, transparent)`,
                      boxShadow: `0 0 12px ${EMOTION_COLORS[emotion] ?? '#64748b'}33`,
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
