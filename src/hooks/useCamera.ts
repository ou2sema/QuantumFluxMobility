import { useEffect, useRef, useState, useCallback } from 'react';

export const useCamera = (defaultFacingMode: 'user' | 'environment' = 'environment') => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(defaultFacingMode);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const attachStreamToVideo = useCallback((video: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
    if (!video) return;

    if (mediaStream) {
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      video.muted = true;
      video.defaultMuted = true;

      const attemptPlay = async () => {
        try {
          await video.play();
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            console.warn('Camera video.play() error:', err);
          }
        }
      };

      if (video.readyState >= 2) {
        attemptPlay();
      } else {
        video.onloadedmetadata = () => {
          attemptPlay();
        };
      }
    } else {
      video.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, []);

  const startCamera = useCallback(async (mode: 'user' | 'environment' = defaultFacingMode) => {
    try {
      setError(null);
      setFacingMode(mode);

      // Stop previous active stream tracks using ref (prevents lifecycle loops)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // ignore
          }
        });
        streamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
      }

      let mediaStream: MediaStream;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (tier1Err) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: mode },
            audio: false,
          });
        } catch (tier2Err) {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setIsCameraActive(true);

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        setHasTorch(Boolean(capabilities?.torch));
      }

      if (videoRef.current) {
        attachStreamToVideo(videoRef.current, mediaStream);
      }
    } catch (err: any) {
      console.warn('Camera access unavailable or denied:', err);
      let errorMsg = 'Caméra non disponible ou permission refusée.';
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        errorMsg = 'Permission refusée : veuillez autoriser l’accès à la caméra dans les réglages du navigateur.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        errorMsg = 'Aucune caméra détectée sur cet appareil.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        errorMsg = 'La caméra est occupée par une autre application.';
      }
      setError(errorMsg);
      setIsCameraActive(false);
    }
  }, [defaultFacingMode, attachStreamToVideo]);

  const switchCamera = useCallback(() => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextState = !isTorchOn;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  }, [isTorchOn]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !isCameraActive) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
  }, [isCameraActive]);

  useEffect(() => {
    if (videoRef.current && stream && isCameraActive) {
      attachStreamToVideo(videoRef.current, stream);
    }
  }, [stream, isCameraActive, attachStreamToVideo]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // ignore
          }
        });
      }
    };
  }, []);

  return {
    videoRef,
    stream,
    isCameraActive,
    facingMode,
    hasTorch,
    isTorchOn,
    startCamera,
    stopCamera,
    switchCamera,
    toggleTorch,
    capturePhoto,
    error,
  };
};