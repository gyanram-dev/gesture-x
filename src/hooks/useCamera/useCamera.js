import { useCallback, useEffect, useRef, useState } from 'react';

function mapGetUserMediaError(err) {
  const name = err?.name;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'permission_denied';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'no_device';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'device_in_use';
  }
  if (name === 'OverconstrainedError' || name === 'ConstraintNotSatisfiedError') {
    return 'constraints_unsatisfied';
  }
  return 'camera_error';
}

export function useCamera() {
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(0);

  const retry = useCallback(() => {
    setSession((s) => s + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Clear stale MediaStream when (re)starting a session before async getUserMedia resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional session reset
    setStream(null);

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setError('unsupported');
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        if (!cancelled) {
          setError(mapGetUserMediaError(err));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [session]);

  return { stream, isLoading, error, retry };
}
