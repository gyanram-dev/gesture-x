import { useCamera } from '../../hooks/useCamera';

export function Camera() {
  const { videoRef, isLoading, error } = useCamera();

  if (isLoading) return <div>Loading camera...</div>;
  if (error === 'permission_denied') return <div>Camera permission denied</div>;
  if (error) return <div>Camera error</div>;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ width: '100vw', height: '100vh', objectFit: 'cover' }}
    />
  );
}
