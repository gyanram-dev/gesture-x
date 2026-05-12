import { useEffect, useRef, useState } from 'react';

const MODEL_URI = '/models';

let faceApiPromise = null;

function loadFaceApiOnce() {
  if (!faceApiPromise) {
    faceApiPromise = (async () => {
      const faceapi = await import('@vladmandic/face-api');
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URI);
      return faceapi;
    })();
  }
  return faceApiPromise;
}

function pickPrimaryFace(detections) {
  if (!Array.isArray(detections) || detections.length === 0) return null;
  return detections.reduce((best, cur) => {
    const b = best.detection.box;
    const c = cur.detection.box;
    return c.width * c.height > b.width * b.height ? cur : best;
  });
}

function dominantFromExpressions(expressions) {
  const entries = Object.entries(expressions ?? {});
  if (entries.length === 0) return ['neutral', 0];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0];
}

export function useEmotionDetection(videoRef, { enabled = true } = {}) {
  const facesRef = useRef([]);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [hud, setHud] = useState(null);
  const hudBudgetRef = useRef({ t: 0, sig: '' });

  useEffect(() => {
    let cancelled = false;

    loadFaceApiOnce()
      .then(() => {
        if (!cancelled) setIsModelLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setModelError(err?.message || 'Failed to load face models');
          setIsModelLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || isModelLoading || modelError) {
      facesRef.current = [];
      return () => {
        setHud(null);
      };
    }

    let running = true;
    let rafId = 0;
    let inFlight = false;

    function pushHudFromDetections(detections) {
      const b = hudBudgetRef.current;
      const now = performance.now();
      const face = pickPrimaryFace(detections);

      if (!face) {
        if (now - b.t > 280) {
          b.t = now;
          b.sig = '';
          setHud(null);
        }
        return;
      }

      const [emotion, score] = dominantFromExpressions(face.expressions);
      const sig = `${emotion}:${score.toFixed(3)}`;
      if (now - b.t < 100 && sig === b.sig) return;

      b.t = now;
      b.sig = sig;
      setHud({
        emotion,
        confidence: score,
        expressions: { ...face.expressions },
      });
    }

    function frame() {
      if (!running) return;

      const video = videoRef?.current;
      const canSample =
        video &&
        video.srcObject &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0;

      const step = async () => {
        if (!running || !canSample || inFlight) return;
        inFlight = true;
        try {
          const faceapi = await loadFaceApiOnce();
          const options = new faceapi.TinyFaceDetectorOptions({
            inputSize: 320,
            scoreThreshold: 0.5,
          });
          const detections = await faceapi
            .detectAllFaces(video, options)
            .withFaceExpressions();

          if (!running) return;

          facesRef.current = detections ?? [];
          pushHudFromDetections(facesRef.current);
        } catch {
          /* drop frame on transient errors */
        } finally {
          inFlight = false;
        }
      };

      void step();

      if (running) {
        rafId = requestAnimationFrame(frame);
      }
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      facesRef.current = [];
      setHud(null);
    };
  }, [enabled, isModelLoading, modelError, videoRef]);

  return { facesRef, hud, isModelLoading, modelError };
}
