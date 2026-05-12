import { memo, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EmotionCard } from '../EmotionCard/EmotionCard';

const EMOTION_COLORS = {
  happy: '#2dd4bf',
  sad: '#38bdf8',
  angry: '#fb7185',
  surprised: '#fbbf24',
  fearful: '#c084fc',
  disgusted: '#a3e635',
  neutral: '#94a3b8',
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

function useEmotionTimeline(hud, max = 12) {
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

const CinematicMark = memo(function CinematicMark({ accent }) {
  return (
    <motion.div
      className="relative flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11"
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 rotate-45 rounded-[3px] border border-cyan-400/35"
        style={{
          boxShadow: `0 0 22px ${accent}40, inset 0 0 14px rgba(34,211,238,0.08)`,
        }}
        animate={{
          opacity: [0.75, 1, 0.75],
        }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-[3px] rotate-45 rounded-[2px] border border-white/12 bg-gradient-to-br from-cyan-500/5 to-violet-600/10"
        style={{ boxShadow: `inset 0 0 16px ${accent}18` }}
      />
    </motion.div>
  );
});

const AnalyticsPanel = memo(function AnalyticsPanel({ hud }) {
  const rows = hud?.expressions
    ? ANALYTICS_ORDER.map((k) => [k, hud.expressions[k] ?? 0])
    : [];

  return (
    <motion.aside
      className="emotionx-glass-panel pointer-events-none fixed bottom-8 right-4 z-[28] w-[min(calc(100vw-2rem),272px)] rounded-2xl p-5 md:bottom-10 md:right-8 md:rounded-3xl md:p-6"
      style={{ borderColor: 'rgba(167, 139, 250, 0.14)' }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
    >
      <div className="mb-5 flex items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <p className="emotionx-micro text-[0.58rem] tracking-[0.24em] text-violet-200/75">
            Neural spectrum
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Expression weights</p>
        </div>
        <span className="emotionx-micro rounded border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.55rem] text-slate-400">
          Live
        </span>
      </div>
      {!hud ? (
        <p className="text-sm text-slate-500">Awaiting lock…</p>
      ) : (
        <ul className="max-h-[min(38vh,240px)] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
          {rows.map(([emotion, value]) => {
            const pct = Math.min(100, Math.max(0, value * 100));
            const color = EMOTION_COLORS[emotion] ?? EMOTION_COLORS.neutral;
            return (
              <li key={emotion}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="font-medium capitalize tracking-wide text-slate-400" style={{ color }}>
                    {emotion}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">{pct.toFixed(0)}%</span>
                </div>
                <div className="relative h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${color}cc, var(--ex-cyan) 100%)`,
                      boxShadow: `0 0 14px ${color}40`,
                    }}
                    initial={false}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 34 }}
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
      className="emotionx-glass-panel pointer-events-none fixed right-4 top-24 z-30 rounded-xl px-3 py-2.5 md:right-7 md:top-28"
      style={{ borderColor: 'rgba(34, 211, 238, 0.16)' }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-1.5 w-1.5 rounded-full bg-cyan-400"
          style={{ boxShadow: '0 0 10px rgba(34,211,238,0.85)' }}
        />
        <span className="emotionx-micro text-[0.55rem] text-cyan-200/80">Render</span>
        <span className="font-mono text-sm tabular-nums text-slate-100">{fps}</span>
      </div>
      <p className="mt-1 pl-3.5 text-[10px] text-slate-500">UI thread</p>
    </motion.div>
  );
});

const Timeline = memo(function Timeline({ events }) {
  return (
    <motion.div
      className="emotionx-glass-panel pointer-events-none fixed bottom-28 left-1/2 z-[28] w-[min(calc(100vw-2rem),680px)] -translate-x-1/2 rounded-2xl px-4 py-3 md:bottom-32 md:rounded-3xl md:px-5"
      style={{ borderColor: 'rgba(34, 211, 238, 0.12)' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="emotionx-micro text-[0.58rem] text-cyan-200/70">Temporal trace</span>
        <span className="text-[10px] text-slate-600">Recent</span>
      </div>
      <div className="flex max-w-full gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {events.length === 0 ? (
          <span className="py-1 text-xs text-slate-500">Stabilizing…</span>
        ) : (
          <AnimatePresence initial={false}>
            {events.map((ev) => {
              const color = EMOTION_COLORS[ev.emotion] ?? EMOTION_COLORS.neutral;
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-slate-950/40 px-3 py-1.5 text-[11px] backdrop-blur-sm"
                  style={{
                    borderColor: `${color}33`,
                    boxShadow: `0 0 20px ${color}15`,
                  }}
                >
                  <span className="font-medium capitalize tracking-wide" style={{ color }}>
                    {ev.emotion}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
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
  const accent = EMOTION_COLORS[dominant] ?? EMOTION_COLORS.neutral;
  const statusLine = isModelLoading
    ? 'Synchronizing vision models…'
    : modelError
      ? 'Neural vision offline'
      : 'Affective inference · locked';

  return (
    <>
      <div className="emotionx-holo-grid pointer-events-none fixed inset-0 z-[8]" aria-hidden />

      <motion.div
        className="pointer-events-none fixed inset-0 z-[9] mix-blend-screen opacity-[0.065]"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.065 }}
      >
        <motion.div
          className="absolute -inset-[38%] bg-[conic-gradient(at_50%_50%,rgba(34,211,238,0.11),transparent_42%,rgba(167,139,250,0.09),transparent_78%)]"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 56, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      <motion.div
        className="pointer-events-none fixed inset-0 z-[10] bg-gradient-to-br from-cyan-500/[0.04] via-transparent to-violet-600/[0.06]"
        aria-hidden
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      <FpsBadge />

      <motion.header
        className="emotionx-hud-breathe pointer-events-none fixed left-0 right-0 top-0 z-30 flex justify-center px-4 pt-6 sm:pt-8"
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="emotionx-glass-panel relative max-w-[min(92vw,520px)] overflow-hidden rounded-2xl px-5 py-3.5 sm:rounded-3xl sm:px-8 sm:py-4"
          style={{ borderColor: 'rgba(34, 211, 238, 0.18)' }}
        >
          <div className="emotionx-shimmer-strip pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative flex flex-wrap items-center justify-center gap-4 sm:justify-between sm:gap-6">
            <div className="flex items-center gap-4">
              <CinematicMark accent={accent} />
              <div className="text-left">
                <p className="emotionx-micro text-[0.58rem] text-cyan-200/85">EmotionX</p>
                <h1 className="mt-0.5 text-sm font-semibold tracking-wide text-slate-100 sm:text-[0.95rem]">
                  Neural interface
                </h1>
                <p className="mt-1 max-w-[240px] text-[11px] leading-snug text-slate-500 sm:max-w-none">
                  {statusLine}
                </p>
              </div>
            </div>
            <div className="hidden h-12 w-px bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent sm:block" />
            <div className="hidden min-w-[100px] text-right sm:block">
              <p className="emotionx-micro text-[0.58rem] text-slate-500">Dominant</p>
              <p
                className="mt-0.5 text-lg font-semibold capitalize tracking-tight text-white"
                style={{ textShadow: `0 0 28px ${accent}44` }}
              >
                {hud ? dominant : '—'}
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      <motion.div
        className="pointer-events-none"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <MemoEmotionCard hud={hud} />
      </motion.div>

      <AnalyticsPanel hud={hud} />
      <Timeline events={events} />

      {modelError ? (
        <motion.div
          className="emotionx-glass-panel pointer-events-none fixed bottom-8 left-1/2 z-40 max-w-[min(92vw,400px)] -translate-x-1/2 rounded-2xl px-4 py-3 text-center text-sm text-red-200"
          style={{ borderColor: 'rgba(248, 113, 113, 0.35)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Model load failed: {modelError}
        </motion.div>
      ) : null}
    </>
  );
});
