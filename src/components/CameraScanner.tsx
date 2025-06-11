import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats, type CameraDevice } from 'html5-qrcode';
import { Camera, CameraOff, Repeat } from 'lucide-react';

interface CameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  onScanError,
  isActive,
  onToggle
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const startScanner = useCallback(async () => {
    if (!currentCameraId || !isActive) return;

    setIsInitializing(true);
    setError(null);

    try {
      scannerRef.current = new Html5Qrcode("qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128],
        verbose: false,
      });

      await scannerRef.current.start(
        { deviceId: { exact: currentCameraId } },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText: string) => {
          onScanSuccess(decodedText);
        },
        (errorMsg: string) => {
          if (!errorMsg.includes("No QR code found")) {
            console.warn("⚠️ Escaneo fallido:", errorMsg);
          }
        }
      );
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)) || "No se pudo iniciar la cámara";
      setError(msg);
      if (onScanError) onScanError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [currentCameraId, isActive, onScanSuccess, onScanError]);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.warn("⚠️ Error al detener el escáner:", err);
      }
    }
  };

  useEffect(() => {
    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, currentCameraId, startScanner]);

  const toggleCamera = () => {
    if (cameras.length < 2) return;
    const currentIndex = cameras.findIndex((cam) => cam.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setCurrentCameraId(cameras[nextIndex].id);
  };

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameras(devices);
        const backCamera = devices.find((d) =>
          d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")
        );
        setCurrentCameraId(backCamera?.id || devices[0]?.id || null);
      })
      .catch((err) => {
        console.error("❌ No se pudo obtener cámaras:", err);
        setError("No se pudieron listar las cámaras disponibles.");
      });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={onToggle}
          disabled={isInitializing}
          className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isActive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
        >
          {isInitializing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Iniciando cámara...
            </>
          ) : isActive ? (
            <>
              <CameraOff className="w-4 h-4" />
              Cerrar Cámara
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Abrir Cámara
            </>
          )}
        </button>

        {isActive && cameras.length > 1 && (
          <button
            onClick={toggleCamera}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
          >
            <Repeat className="w-4 h-4" />
            Cambiar cámara
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">Error de cámara:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isActive && !error && (
        <>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
            <div id="qr-reader" className="w-full" />
          </div>
          <div className="text-sm text-gray-600 text-center space-y-1">
            <p>📱 <strong>Apunta la cámara hacia el código</strong></p>
            <p>🔍 El escaneo es automático</p>
            <p>📋 Soporta QR y códigos de barras</p>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraScanner;
