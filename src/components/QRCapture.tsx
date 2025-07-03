import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
} from "html5-qrcode";
import { Camera, CameraOff, Repeat, Search } from "lucide-react";

interface QRCaptureProps {
  onCodeDetected: (code: string) => void;
  isActive: boolean;
  onToggle: () => void;
}

const QRCapture: React.FC<QRCaptureProps> = ({
  onCodeDetected,
  isActive,
  onToggle,
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const lastDetectedRef = useRef<{ code: string; timestamp: number }>({
    code: "",
    timestamp: 0,
  });

  const startScanner = useCallback(async () => {
    if (!currentCameraId || !isActive) return;

    setIsInitializing(true);
    setError(null);

    try {
      scannerRef.current = new Html5Qrcode("qr-reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });

      await scannerRef.current.start(
        { deviceId: { exact: currentCameraId } },
        {
          fps: 5,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText: string) => {
          const now = Date.now();
          if (
            decodedText !== lastDetectedRef.current.code ||
            now - lastDetectedRef.current.timestamp > 2000
          ) {
            lastDetectedRef.current = {
              code: decodedText,
              timestamp: now,
            };
            onCodeDetected(decodedText);
          }
        },
        (errorMsg: string) => {
          if (!errorMsg.includes("No QR code found")) {
            console.warn("⚠️ Escaneo fallido:", errorMsg);
          }
        }
      );
    } catch (err) {
      const msg =
        (err instanceof Error ? err.message : String(err)) ||
        "No se pudo iniciar la cámara";
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [currentCameraId, isActive, onCodeDetected]);

  const stopScanner = useCallback(async () => {
    if (
      scannerRef.current &&
      scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
    ) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.warn("⚠️ Error al detener el escáner:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, startScanner, stopScanner]);

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
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear")
        );
        setCurrentCameraId(backCamera?.id || devices[0]?.id || null);
      })
      .catch((err) => {
        console.error("❌ No se pudo obtener cámaras:", err);
        setError("No se pudieron listar las cámaras disponibles.");
      });
  }, []);

  const [manualCode, setManualCode] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onCodeDetected(manualCode.trim());
      setManualCode("");
    }
  };

  return (
    <div className="space-y-4">
     

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">Error de cámara:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Botón para abrir la cámara (celeste) */}
      {!isActive && (
        <div
          onClick={!isInitializing ? onToggle : undefined}
          className={`
            flex items-center justify-center mx-auto
            bg-sky-400
            ${
              isInitializing
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }
            transition-colors
            w-32 h-32
            my-4
            select-none
            relative
          `}
        >
          {/* Cuadrado intermedio blanco */}
          <div className="absolute left-1/2 top-1/2 z-10 h-[94px] w-[94px] -translate-x-1/2 -translate-y-1/2 bg-white" />
          {/* Cuadrado pequeño del mismo color */}
          <div className="absolute left-1/2 top-1/2 z-20 h-[52px] w-[52px] -translate-x-1/2 -translate-y-1/2 bg-sky-400" />
        </div>
      )}

      {/* Visor de la cámara y botones de control (cuando está activa) */}
      {isActive && !error && (
        <>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
            <div id="qr-reader" className="w-full" />
          </div>

          <div className="flex gap-2 mt-2">
            {/* Botón para voltear la cámara (cuadrado, celeste) */}
            {cameras.length > 1 && (
              <button
                onClick={toggleCamera}
                disabled={isInitializing}
                className="h-12 w-12 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 bg-sky-400 hover:bg-sky-500 text-white"
                aria-label="Cambiar cámara"
              >
                <Repeat className="w-5 h-5" />
              </button>
            )}

            {/* Botón para cerrar la cámara (verde) */}
            <button
              onClick={onToggle}
              disabled={isInitializing}
              className="flex-1 h-12 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 bg-green-600 hover:bg-green-700 text-white"
            >
              <CameraOff className="w-4 h-4" />
              Cerrar Cámara
            </button>
          </div>
        </>
      )}
      {/* Formulario de entrada manual */}
      <form
        onSubmit={handleManualSubmit}
        className="flex gap-2"
      >
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Ingresa el código manualmente"
          className="flex-1 h-12 px-4 rounded-lg border border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0 focus:ring-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-lg bg-[#0097D4] hover:bg-[#0086BF] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!manualCode.trim()}
          aria-label="Buscar código"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>
    </div>
    
  );
};

export default QRCapture;
