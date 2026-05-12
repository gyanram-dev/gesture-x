import { forwardRef, useEffect } from 'react';

export const Camera = forwardRef(function Camera({ stream, videoClassName = '' }, ref) {
  useEffect(() => {
    const video = ref && typeof ref !== 'function' ? ref.current : null;
    if (!video) return;

    video.srcObject = stream ?? null;

    return () => {
      video.srcObject = null;
    };
  }, [stream, ref]);

  return (
    <video
      ref={ref}
      className={videoClassName}
      autoPlay
      playsInline
      muted
      controls={false}
    />
  );
});
