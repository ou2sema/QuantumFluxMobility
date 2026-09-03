import { useEffect, useRef, useState } from 'react';

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      setError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access unavailable or denied, falling back to simulated high-res photo generator:', err);
      setError('Caméra non disponible ou permission refusée.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = (): string | null => {
    if (!videoRef.current || !isCameraActive) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Add timestamp watermark
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(10, canvas.height - 30, 200, 24);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(new Date().toLocaleString('fr-FR'), 16, canvas.height - 14);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (e) {
      console.error('Error capturing from video element:', e);
    }
    return null;
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    isCameraActive,
    startCamera,
    stopCamera,
    capturePhoto,
    error,
  };
};
