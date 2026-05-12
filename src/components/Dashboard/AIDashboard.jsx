import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EmotionCard } from '../EmotionCard/EmotionCard';

const EMOTION_COLORS = {
  happy: '#34d399',
  sad: '#60a5fa',
  angry: '#f87171',
  surprised: '#fbbf24',
  fearful: '#c084fc',
  disgusted: '#a3e635',
  neutral: '#94a3b8',
};

const EMOTION_GLYPH = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  neutral: '😐',
  surprised: '😮',
  fearful: '😨',
  disgusted: '🤢',
};

const ANALYTICS_ORDER = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted'];

function useUiFps(sampleMs = 450) {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let lastSample = performance.now();

    const loop = (t) => {
      frames += 1;
      if (t - lastSample >= sampleMs) {
        const dt = (t - lastSample) / 1000;
        setFps(Math.min(240, Math.round(frames / dt)));
        frames = 0;
        lastSample = t;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sampleMs]);

  return fps;
}

function useEmotionTimeline(hud, max = 14) {
  const [events, setEvents] = useState([]);
  const sigRef = useRef('');

  useEffect(() => {
    if (!hud) return;
    const sig = `${hud.emotion}:${hud.confidence.toFixed(2)}`;
    if (sig === sigRef.current) return;
    sigRef.current = sig;
    const id = `${Date.now()}-${sig}`;
    setEvents((prev) => [{ id, emotion: hud.emotion, confidence: hud.confidence, at: Date.now() }, ...prev].slice(0, max));
  }, [hud, max]);

  return events;
}

const MemoEmotionCard = memo(EmotionCard);

const AnalyticsPanel = memo(function AnalyticsPanel({ hud }) {
  const rows = hud?.expressions
    ? ANALYTICS_ORDER.map((k) => [k, hud.expressions[k] ?? 0])
    : [];

  return (
    <motion.aside
      className="pointer-events-none fixed bottom-6 right-6 z-[28] w-[min(92vw,280px)] overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-slate-950/65 p-4 shadow-[0_0_36px_rgba(192,132,252,0.18)] backdrop-blur-xl"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-fuchsia-200/80">
          Neural analytics
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-widest text-slate-400">
          Live
        </span>
      </div>
      {!hud ? (
        <p className="text-sm text-slate-500">Awaiting facial lock…</p>
      ) : (
        <ul className="space-y-2.5">
          {rows.map(([emotion, value]) => {
            const pct = Math.min(100, Math.max(0, value * 100));
            const color = EMOTION_COLORS[emotion] ?? EMOTION_COLORS.neutral;
            return (
              <li key={emotion}>
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-300">
                  <span className="capitalize" style={{ color }}>
                    {emotion}
                  </span>
                  <span className="tabular-nums text-slate-500">{pct.toFixed(0)}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${color}, #22d3ee)`,
                      boxShadow: `0 0 14px ${color}55`,
                    }}
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.aside>
  );
});

const FpsBadge = memo(function FpsBadge() {
  const fps = useUiFps(500);
  return (
    <motion.div
      className="pointer-events-none fixed right-5 top-24 z-30 rounded-xl border border-emerald-400/25 bg-slate-950/70 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-emerald-200/90 shadow-[0_0_28px_rgba(16,185,129,0.2)] backdrop-blur-xl sm:right-7 sm:top-28"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
        <span className="tabular-nums text-xs text-slate-100">{fps}</span>
        <span className="text-slate-500">fps</span>
      </div>
      <p className="mt-1 text-[9px] font-normal normal-case tracking-normal text-slate-500">UI thread</p>
    </motion.div>
  );
});

const EmotionGlyph = memo(function EmotionGlyph({ emotion }) {
  const g = EMOTION_GLYPH[emotion] ?? '◇';
  return (
    <motion.span
      key={emotion}
      className="select-none text-3xl sm:text-4xl"
      aria-hidden
      initial={{ scale: 0.9, opacity: 0.5, rotate: -6 }}
      animate={{
        scale: [1, 1.06, 1],
        opacity: 1,
        rotate: [0, 3, 0],
      }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      {g}
    </motion.span>
  );
});

const Timeline = memo(function Timeline({ events }) {
  return (
    <motion.div
      className="pointer-events-none fixed bottom-20 left-1/2 z-[28] w-[min(96vw,720px)] -translate-x-1/2 rounded-2xl border border-cyan-400/20 bg-slate-950/55 px-3 py-2 shadow-[0_0_32px_rgba(34,211,238,0.14)] backdrop-blur-xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-[9px] font-semibold uppercase tracking-[0.24em] text-cyan-200/75">
          Affect timeline
        </span>
        <span className="text-[9px] text-slate-500">Recent shifts</span>
      </div>
      <div className="flex max-w-full gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.length === 0 ? (
          <span className="px-2 py-1 text-xs text-slate-500">Calibrating stream…</span>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const color = EMOTION_COLORS[ev.emotion] ?? EMOTION_COLORS.neutral;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: 12, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className="flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 text-[11px]"
                  style={{
                    borderColor: `${color}55`,
                    background: `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(15,23,42,0.55))`,
                    boxShadow: `0 0 18px ${color}22`,
                  }}
                >
                  <span className="capitalize" style={{ color }}>
                    {ev.emotion}
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {(ev.confidence * 100).toFixed(0)}%
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
});

export const AIDashboard = memo(function AIDashboard({ hud, isModelLoading, modelError }) {
  const events = useEmotionTimeline(hud);
  const dominant = hud?.emotion ?? 'neutral';
  const statusLine = isModelLoading
    ? 'Syncing face models…'
    : modelError
      ? 'Vision offline'
      : 'Realtime affect pipeline armed';

  return (
    <>
      <div className="emotionx-holo-grid pointer-events-none fixed inset-0 z-[8]" aria-hidden />
      <motion.div
        className="pointer-events-none fixed inset-0 z-[9] mix-blend-screen opacity-[0.11]"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.11 }}
      >
        <motion.div
          className="absolute -inset-[40%] bg-[conic-gradient(at_50%_50%,rgba(34,211,238,0.14),transparent_40%,rgba(192,132,252,0.12),transparent_75%)]"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 48, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      <motion.div
        className="pointer-events-none fixed inset-0 z-[10] bg-gradient-to-br from-cyan-500/5 via-transparent to-fuchsia-500/10"
        aria-hidden
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <FpsBadge />

      <motion.header
        className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex justify-center px-4 pt-6 sm:pt-8"
        initial={{ y: -14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative overflow-hidden rounded-full border border-cyan-400/35 bg-slate-950/55 px-5 py-2.5 shadow-[0_0_42px_rgba(34,211,238,0.22)] backdrop-blur-xl sm:px-7">
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-fuchsia-500/15 to-cyan-500/15"
            animate={{ x: ['-30%', '30%', '-30%'] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          <div className="relative flex items-center gap-3 sm:gap-4">
            <EmotionGlyph emotion={dominant} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-100/90">
                EmotionX · Neural HUD
              </span>
              <span className="text-[11px] text-slate-400">{statusLine}</span>
            </div>
            <motion.span
              className="hidden h-9 w-px bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent sm:block"
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity }}
            />
            <div className="hidden flex-col text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:flex">
              <span className="text-slate-300">Dominant</span>
              <span className="text-sm font-semibold capitalize tracking-normal text-white">
                {hud ? dominant : '—'}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div
        className="pointer-events-none"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <MemoEmotionCard hud={hud} />
      </motion.div>

      <AnalyticsPanel hud={hud} />
      <Timeline events={events} />

      {modelError ? (
        <motion.div
          className="pointer-events-none fixed bottom-8 left-1/2 z-40 max-w-[min(92vw,420px)] -translate-x-1/2 rounded-xl border border-red-400/35 bg-red-950/85 px-4 py-3 text-center text-sm text-red-100 shadow-[0_0_30px_rgba(248,113,113,0.35)] backdrop-blur-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Model load failed: {modelError}
        </motion.div>
      ) : null}
    </>
  );
});
