import { useEffect, useRef, useState, useCallback } from 'react';

export const useCamera = (defaultFacingMode: 'user' | 'environment' = 'environment') => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(defaultFacingMode);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Safely attach stream to video element and trigger play on mobile
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
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
    setHasTorch(false);
  }, [stream]);

  const startCamera = useCallback(async (mode: 'user' | 'environment' = facingMode) => {
    try {
      setError(null);
      setFacingMode(mode);

      // Stop previous tracks if any
      if (stream) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // ignore
          }
        });
        setStream(null);
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MEDIA_DEVICES_NOT_SUPPORTED');
      }

      let mediaStream: MediaStream;

      // Tier 1: Ideal constraints for mobile cameras
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
        console.warn('Initial camera constraints failed, attempting fallback:', tier1Err);
        // Tier 2: Simple facingMode
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: mode,
            },
            audio: false,
          });
        } catch (tier2Err) {
          console.warn('Tier 2 camera constraints failed, falling back to basic video:', tier2Err);
          // Tier 3: Basic video
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      setStream(mediaStream);
      setIsCameraActive(true);

      // Check for torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        setHasTorch(Boolean(capabilities?.torch));
      }

      // If video element is already mounted, attach immediately
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
  }, [facingMode, stream, attachStreamToVideo]);

  const switchCamera = useCallback(() => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  const toggleTorch = useCallback(async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
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
  }, [stream, isTorchOn]);

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
  }, [isCameraActive]);

  // Synchronize stream with videoRef whenever either changes
  useEffect(() => {
    if (videoRef.current && stream && isCameraActive) {
      attachStreamToVideo(videoRef.current, stream);
    }
  }, [stream, isCameraActive, attachStreamToVideo]);

  // Clean up tracks when hook unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            // ignore
          }
        });
      }
    };
  }, [stream]);

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