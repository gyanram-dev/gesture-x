import { useEffect, useRef } from 'react';

const MEDIAPIPE_HANDS_VERSION = '0.4.1675469240';
const SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/hands.js`;

const locateFile = (file) =>
  `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VERSION}/${file}`;

let scriptPromise = null;
let handsInstance = null;

function ensureHandsScript() {
  if (typeof globalThis.Hands === 'function') {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-emotionx-mp-hands="${SCRIPT_URL}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('MediaPipe Hands script failed')), {
          once: true,
        });
        return;
      }
      const s = document.createElement('script');
      s.src = SCRIPT_URL;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.dataset.emotionxMpHands = SCRIPT_URL;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('MediaPipe Hands script failed to load'));
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

async function getHands() {
  await ensureHandsScript();
  const Hands = globalThis.Hands;
  if (typeof Hands !== 'function') {
    throw new Error('MediaPipe Hands is not available on window');
  }
  if (!handsInstance) {
    handsInstance = new Hands({ locateFile });
    handsInstance.setOptions({
      selfieMode: true,
      maxNumHands: 2,
      modelComplexity: 0,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
  }
  return handsInstance;
}

export function useHandTracking(videoRef, { enabled = true } = {}) {
  const resultsRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      resultsRef.current = null;
      return undefined;
    }

    let running = true;
    let rafId = 0;
    let inFlight = false;
    let hands = null;

    (async () => {
      try {
        hands = await getHands();
      } catch {
        return;
      }
      if (!running) return;

      hands.onResults((results) => {
        resultsRef.current = results;
      });

      const tick = () => {
        if (!running) return;

        const video = videoRef?.current;
        const canSend =
          hands &&
          video &&
          video.srcObject &&
          video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
          video.videoWidth > 0 &&
          video.videoHeight > 0;

        if (canSend && !inFlight) {
          inFlight = true;
          hands
            .send({ image: video })
            .catch(() => {
              /* drop frame */
            })
            .finally(() => {
              inFlight = false;
            });
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    })();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      resultsRef.current = null;
    };
  }, [enabled, videoRef]);

  return { resultsRef };
}
