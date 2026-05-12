import { useRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { useEmotionDetection } from '../../hooks/useEmotionDetection';
import { useHandTracking } from '../../hooks/useHandTracking';
import { Camera } from '../../components/Camera';
import { EmotionOverlay } from '../../components/EmotionOverlay';
import { HandOverlay } from '../../components/HandOverlay';
import { VirtualCursor } from '../../components/VirtualCursor';
import { AIDashboard } from '../../components/Dashboard/AIDashboard';

const shellClass =
  'emotionx-shell flex min-h-dvh w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center';

function LoadingView() {
  return (
    <div className={shellClass} role="status" aria-live="polite">
      <div className="emotionx-brand text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        EmotionX
      </div>
      <div className="emotionx-loader h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
      <p className="max-w-sm text-sm text-slate-400 sm:text-base">Starting camera…</p>
    </div>
  );
}

function ErrorView({ title, detail, onRetry }) {
  return (
    <div className={shellClass}>
      <div className="emotionx-brand text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        EmotionX
      </div>
      <p className="max-w-md text-red-300/90">{title}</p>
      {detail ? <p className="max-w-md text-sm text-slate-500">{detail}</p> : null}
      {onRetry ? (
        <button
          type="button"
          className="emotionx-retry mt-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-5 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/20"
          onClick={onRetry}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

const errorCopy = {
  permission_denied: {
    title: 'Camera access was blocked.',
    detail: 'Allow camera permission for this site in your browser settings, then try again.',
    retry: true,
  },
  no_device: {
    title: 'No camera was found.',
    detail: 'Connect a webcam or enable your built-in camera, then retry.',
    retry: true,
  },
  device_in_use: {
    title: 'The camera is already in use.',
    detail: 'Close other apps or tabs using the camera, then try again.',
    retry: true,
  },
  constraints_unsatisfied: {
    title: 'This camera cannot satisfy the requested settings.',
    detail: 'Try again or use a different camera if available.',
    retry: true,
  },
  unsupported: {
    title: 'Camera is not available in this environment.',
    detail: 'Use a secure context (HTTPS or localhost) and a modern browser.',
    retry: false,
  },
  camera_error: {
    title: 'Could not start the camera.',
    detail: 'Check your device and browser permissions.',
    retry: true,
  },
};

export function HomePage() {
  const videoRef = useRef(null);
  const { stream, isLoading, error, retry } = useCamera();
  const cameraLive = !isLoading && !error && !!stream;
  const { facesRef, hud, isModelLoading, modelError } = useEmotionDetection(videoRef, {
    enabled: cameraLive,
  });
  const { resultsRef } = useHandTracking(videoRef, { enabled: cameraLive });

  if (isLoading) {
    return <LoadingView />;
  }

  if (error) {
    const copy = errorCopy[error] ?? errorCopy.camera_error;
    return (
      <ErrorView
        title={copy.title}
        detail={copy.detail}
        onRetry={copy.retry ? retry : undefined}
      />
    );
  }

  return (
    <div className="emotionx-stage fixed inset-0 overflow-hidden bg-black">
      <Camera
        ref={videoRef}
        stream={stream}
        videoClassName="emotionx-video pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      {!modelError && (
        <EmotionOverlay videoRef={videoRef} facesRef={facesRef} stream={stream} />
      )}
      <HandOverlay videoRef={videoRef} resultsRef={resultsRef} stream={stream} />
      <VirtualCursor videoRef={videoRef} resultsRef={resultsRef} enabled={cameraLive} />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35"
        aria-hidden
      />
      <AIDashboard hud={hud} isModelLoading={isModelLoading} modelError={modelError} />
    </div>
  );
}
