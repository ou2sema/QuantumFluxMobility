import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  RotateCcw,
  FlipHorizontal,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  Smartphone,
  User,
  Car,
} from 'lucide-react';
import { TactileButton } from './TactileButton';

interface PhotoUploadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (photoUrl: string) => void;
  title?: string;
  subtitle?: string;
  aspectRatio?: 'square' | 'wide';
  defaultFacingMode?: 'environment' | 'user';
  currentPhotoUrl?: string;
}

/**
 * Optimizes an image File into a lightweight, high-res Base64 string using Canvas
 */
const optimizeImageFile = (
  file: File,
  maxDimension: number = 1280,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const PhotoUploadCaptureModal: React.FC<PhotoUploadCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSelected,
  title = 'Ajouter une photo',
  subtitle = 'Importez depuis votre appareil ou prenez une photo instantanée',
  aspectRatio = 'wide',
  defaultFacingMode = 'environment',
  currentPhotoUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera'>('upload');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(defaultFacingMode);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start camera helper
  const startCameraStream = async (targetFacing: 'environment' | 'user' = facingMode) => {
    stopCameraStream();
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: aspectRatio === 'square' ? 1080 : 1920 },
          height: { ideal: aspectRatio === 'square' ? 1080 : 1080 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Unable to access camera directly:', err);
      setCameraError(
        'Accès caméra indisponible ou non autorisé par le navigateur. Vous pouvez importer une photo depuis votre appareil ci-dessous.'
      );
      setIsCameraActive(false);
    }
  };

  // Switch camera tab effect
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !previewUrl) {
      startCameraStream(facingMode);
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab, facingMode, previewUrl]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setCameraError(null);
      setFacingMode(defaultFacingMode);
    } else {
      stopCameraStream();
    }
  }, [isOpen, defaultFacingMode]);

  if (!isOpen) return null;

  // Toggle between front and rear cameras
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (activeTab === 'camera' && !previewUrl) {
      startCameraStream(nextMode);
    }
  };

  // Handle shutter capture
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !isCameraActive) return;

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // If front selfie camera, mirror horizontally for natural feel
        if (facingMode === 'user') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPreviewUrl(dataUrl);
        stopCameraStream();
      }
    } catch (err) {
      console.error('Failed to capture snapshot from camera:', err);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP).');
      return;
    }

    setIsProcessing(true);
    try {
      const maxDim = aspectRatio === 'square' ? 800 : 1280;
      const optimized = await optimizeImageFile(file, maxDim, 0.85);
      setPreviewUrl(optimized);
    } catch (err) {
      console.error('Error processing image file:', err);
      alert('Erreur lors du traitement de l’image.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Veuillez déposer un fichier image valide.');
      return;
    }

    setIsProcessing(true);
    try {
      const maxDim = aspectRatio === 'square' ? 800 : 1280;
      const optimized = await optimizeImageFile(file, maxDim, 0.85);
      setPreviewUrl(optimized);
    } catch (err) {
      console.error('Error processing dropped image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm photo
  const handleConfirm = () => {
    if (previewUrl) {
      onPhotoSelected(previewUrl);
      stopCameraStream();
      onClose();
    }
  };

  // Retake / pick again
  const handleRetake = () => {
    setPreviewUrl(null);
    if (activeTab === 'camera') {
      startCameraStream(facingMode);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 select-none"
    >
      <div className="w-full max-w-xl bg-[#0D1224] border border-gray-800 rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl animate-in fade-in">
        {/* Header */}
        <div className="px-5 py-4 bg-[#151B30] border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              {aspectRatio === 'square' ? <User className="w-5 h-5" /> : <Car className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">{title}</h2>
              <p className="text-xs text-gray-400 leading-tight mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs (Upload vs Camera) */}
        {!previewUrl && (
          <div className="px-5 pt-4 pb-2 bg-[#0D1224]">
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#151B30] rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  setActiveTab('upload');
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Depuis l'appareil</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  startCameraStream(facingMode);
                }}
                className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeTab === 'camera'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Prendre en photo</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col items-center justify-center">
          {/* STATE 1: PREVIEW READY TO CONFIRM */}
          {previewUrl ? (
            <div className="w-full space-y-4 flex flex-col items-center">
              <div
                className={`w-full overflow-hidden rounded-2xl bg-black border-2 border-blue-500/60 shadow-2xl relative flex items-center justify-center ${
                  aspectRatio === 'square' ? 'max-w-xs aspect-square rounded-full' : 'max-w-md aspect-video'
                }`}
              >
                <img
                  src={previewUrl}
                  alt="Aperçu sélectionné"
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                  Prête à être enregistrée
                </span>
              </div>

              <div className="flex items-center gap-3 w-full max-w-md justify-center">
                <TactileButton
                  variant="outline"
                  onClick={handleRetake}
                  className="flex-1 min-h-[44px] text-xs font-bold flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reprendre</span>
                </TactileButton>

                <TactileButton
                  variant="primary"
                  onClick={handleConfirm}
                  className="flex-1 min-h-[44px] text-xs font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 border-emerald-400/40"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmer la photo</span>
                </TactileButton>
              </div>
            </div>
          ) : activeTab === 'upload' ? (
            /* STATE 2: UPLOAD FROM DEVICE */
            <div className="w-full space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-400 bg-blue-950/40 scale-[1.01]'
                    : 'border-gray-700 bg-[#151B30]/60 hover:border-gray-600 hover:bg-[#151B30]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mb-3">
                  <Upload className="w-8 h-8" />
                </div>

                <h3 className="text-sm font-bold text-white mb-1">
                  {isProcessing ? 'Optimisation en cours...' : 'Sélectionnez ou glissez-déposez une photo'}
                </h3>
                <p className="text-xs text-gray-400 max-w-sm mb-4">
                  Compatible avec les formats JPG, PNG, WEBP depuis votre ordinateur, tablette ou smartphone.
                </p>

                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 pointer-events-none"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Parcourir mes fichiers</span>
                </button>
              </div>

              {currentPhotoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#151B30] border border-gray-800">
                  <img
                    src={currentPhotoUrl}
                    alt="Photo actuelle"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-700 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] text-gray-400 block font-semibold">Photo actuelle</span>
                    <span className="text-xs text-gray-200 truncate block font-mono">Conserver si aucun changement</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STATE 3: LIVE CAMERA VIEWFINDER */
            <div className="w-full flex flex-col items-center space-y-3">
              {cameraError ? (
                <div className="p-5 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs text-center space-y-3 max-w-md">
                  <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p>{cameraError}</p>
                  <TactileButton
                    variant="primary"
                    onClick={() => setActiveTab('upload')}
                    className="text-xs"
                  >
                    Importer depuis les fichiers de l'appareil
                  </TactileButton>
                </div>
              ) : (
                <>
                  <div
                    className={`w-full overflow-hidden rounded-2xl bg-black border border-gray-800 relative flex items-center justify-center shadow-2xl ${
                      aspectRatio === 'square' ? 'max-w-xs aspect-square' : 'max-w-md aspect-video'
                    }`}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                    />

                    {/* Viewfinder guides */}
                    {aspectRatio === 'square' ? (
                      <div className="absolute inset-4 rounded-full border-2 border-dashed border-cyan-400/60 pointer-events-none" />
                    ) : (
                      <div className="absolute inset-4 rounded-xl border border-dashed border-cyan-400/40 pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] text-cyan-300/60 font-mono tracking-widest uppercase bg-black/40 px-2 py-0.5 rounded">
                          Cadrez le véhicule
                        </span>
                      </div>
                    )}

                    {/* Camera Flip Switch Button */}
                    <button
                      type="button"
                      onClick={toggleFacingMode}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition cursor-pointer shadow-lg"
                      title="Changer de caméra (avant/arrière)"
                      aria-label="Changer de caméra"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Shutter Button */}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <button
                      type="button"
                      onClick={handleCaptureSnapshot}
                      className="w-16 h-16 rounded-full bg-white hover:bg-slate-100 text-slate-900 flex items-center justify-center shadow-2xl active:scale-95 transition-all border-4 border-blue-500 cursor-pointer"
                      title="Prendre la photo"
                      aria-label="Prendre la photo"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Camera className="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#151B30] border-t border-gray-800 flex items-center justify-between">
          <TactileButton
            variant="outline"
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="text-xs h-9 px-4"
          >
            Annuler
          </TactileButton>

          <span className="text-[11px] text-gray-500 font-medium">
            Photos sécurisées et optimisées localement
          </span>
        </div>
      </div>
    </div>
  );
};
