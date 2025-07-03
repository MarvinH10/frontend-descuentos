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

  const stopScanner = async () => {
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
      <div
        onClick={!isInitializing ? onToggle : undefined}
        className={`
              flex items-center justify-center mx-auto
              ${isActive ? "bg-red-600" : "bg-sky-400"}
              ${
                isInitializing
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              }
              transition-colors
              w-32 h-32
              mb-4
              select-none
              relative
            `}
        style={{ minWidth: 128, minHeight: 128 }}
      >
        {/* Cuadrado intermedio blanco */}
        <div
          className="absolute"
          style={{
            width: 94,
            height: 94,
            background: "white",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
          }}
        />
        {/* Cuadrado pequeño del mismo color */}
        <div
          className="absolute"
          style={{
            width: 52,
            height: 52,
            background: isActive ? "#dc2626" : "#38bdf8", // sky-400 o red-600
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
          }}
        />
      </div>

      {isActive && !error && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
          <div id="qr-reader" className="w-full" />
        </div>
      )}
      <form
        onSubmit={handleManualSubmit}
        className="flex flex-col sm:flex-row gap-2 mb-4"
      >
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Ingresa el código manualmente"
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0 focus:ring-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          disabled={!manualCode.trim()}
        >
          <Search className="inline w-4 h-4" />
          Buscar
        </button>
      </form>
      <div className="flex gap-2">
        {isActive && cameras.length > 1 && (
          <button
            onClick={toggleCamera}
            className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center gap-2"
          >
            <Repeat className="w-4 h-4" />
            Cambiar Cámara
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">Error de cámara:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default QRCapture;
