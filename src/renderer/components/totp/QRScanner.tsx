import { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  AlertCircle,
} from 'lucide-react';
import jsQR from 'jsqr';
import { useVaultStore } from '../../stores/vault-store';

export function QRScanner() {
  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setQRScannerOpen = useVaultStore((state) => state.setQRScannerOpen);
  const saveEntry = useVaultStore((state) => state.saveEntry);
  const categories = useVaultStore((state) => state.categories);

  const handleTOTPUri = async (uri: string) => {
    try {
      const parsed = await window.vaultAPI.parseTOTPUri(uri);
      await saveEntry({
        type: 'totp',
        title: parsed.title || parsed.issuer,
        issuer: parsed.issuer,
        account: parsed.account,
        secret: parsed.secret,
        algorithm: parsed.algorithm,
        digits: parsed.digits,
        period: parsed.period,
        categoryId: categories[0]?.id || '',
        favorite: false,
      });
      setQRScannerOpen(false);
    } catch (err: any) {
      setError(err?.message || 'QR code invalide pour le protocole TOTP.');
    }
  };

  useEffect(() => {
    if (activeTab !== 'camera') return;

    let stream: MediaStream | null = null;
    let animationFrameId: number;

    const startCamera = async () => {
      try {
        setError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.play();
          requestAnimationFrame(scanFrame);
        }
      } catch (err) {
        console.warn('Camera access denied or unavailable:', err);
        setHasCamera(false);
        setActiveTab('file');
      }
    };

    const scanFrame = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            handleTOTPUri(code.data);
            return;
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
          handleTOTPUri(code.data);
        } else {
          setError('Aucun QR code 2FA valide détecté dans cette image.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-colors">
        {/* En-tête Modal Stitch */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-[#27272A] flex items-center justify-between bg-zinc-50 dark:bg-[#121215] transition-colors">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse"></span>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
              Scanner un QR Code 2FA
            </h3>
          </div>
          <button
            onClick={() => setQRScannerOpen(false)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-4">
          {/* Segmented Control Camera / Import */}
          <div className="bg-zinc-100 dark:bg-[#18181B] p-1 rounded-xl border border-zinc-200 dark:border-[#27272A] flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              disabled={!hasCamera}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4 text-[#0891B2] dark:text-[#06B6D4]" />
              <span>Caméra</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-[#27272A] text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4 text-[#059669] dark:text-[#10B981]" />
              <span>Importer image</span>
            </button>
          </div>

          {/* Viseur Caméra ou Drag & Drop Fichier */}
          {activeTab === 'camera' ? (
            <div className="relative w-full h-64 bg-[#09090B] rounded-2xl border border-zinc-300 dark:border-[#27272A] overflow-hidden flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Cadre de visée Glowing Stitch */}
              <div className="relative w-44 h-44 flex items-center justify-center z-10 pointer-events-none">
                {/* Coins cyan lumineux */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#06B6D4] rounded-tl-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#06B6D4] rounded-tr-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#06B6D4] rounded-bl-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#06B6D4] rounded-br-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div>
                {/* Ligne laser animée */}
                <div className="absolute left-1 right-1 h-0.5 brand-gradient shadow-[0_0_12px_#06B6D4] animate-pulse" />
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 bg-zinc-50 hover:bg-zinc-100 dark:bg-[#18181B]/60 dark:hover:bg-[#18181B] border-2 border-dashed border-zinc-300 dark:border-[#27272A] hover:border-[#06B6D4]/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center transition cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272A] flex items-center justify-center text-[#0891B2] dark:text-[#06B6D4] mb-3 group-hover:scale-110 transition-transform shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mb-1">
                Cliquez pour importer une capture ou un QR code
              </h4>
              <p className="text-[11px] text-zinc-500 font-mono">
                Formats acceptés : PNG, JPG, WEBP
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-2 border-t border-zinc-200 dark:border-[#27272A]/70">
            <span>Protocole standardisé otpauth://</span>
            <span className="text-[#059669] dark:text-[#10B981]">RFC 6238</span>
          </div>
        </div>
      </div>
    </div>
  );
}
