import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { Camera, CameraOff } from 'lucide-react';

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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const startScanner = async () => {
      if (scannerRef.current) return;

      setIsInitializing(true);
      setError(null);

      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
          facingMode: "environment",
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: false
        };

        scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);

        scannerRef.current.render(
          (decodedText: string) => {
            onScanSuccess(decodedText);
            setError(null);
          },
          (errorMessage: string) => {
            if (
              !errorMessage.includes("No QR code found") &&
              !errorMessage.includes("QR code parse error") &&
              !errorMessage.includes("NotFoundException")
            ) {
              console.warn("⚠️ Error de escaneo:", errorMessage);
            }
          }
        );

        setIsInitializing(false);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Error desconocido al iniciar la cámara";
        console.error("❌ Error al iniciar escáner:", err);
        setError(`Error al acceder a la cámara: ${errorMsg}`);
        setIsInitializing(false);

        if (onScanError) {
          onScanError(errorMsg);
        }
      }
    };

    const stopScanner = () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
          scannerRef.current = null;
          setError(null);
        } catch (err) {
          console.warn("⚠️ Error al detener el escáner:", err);
        }
      }
      setIsInitializing(false);
    };

    if (isActive) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isActive, onScanSuccess, onScanError]);

  return (
    <div className="space-y-4">
      {/* Botón para activar/desactivar cámara */}
      <button
        onClick={onToggle}
        disabled={isInitializing}
        className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isActive
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

      {/* Mensaje de error */}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">Error de cámara:</p>
          <p className="text-sm">{error}</p>
          <p className="text-xs mt-1">💡 Asegúrate de:</p>
          <ul className="text-xs mt-1 list-disc list-inside">
            <li>Permitir acceso a la cámara en el navegador</li>
            <li>Usar HTTPS (o localhost para desarrollo)</li>
            <li>Que tu dispositivo tenga cámara disponible</li>
          </ul>
        </div>
      )}

      {/* Contenedor del escáner */}
      {isActive && !error && (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
          <div id="qr-reader" className="w-full"></div>
        </div>
      )}

      {/* Instrucciones */}
      {isActive && !error && (
        <div className="text-sm text-gray-600 text-center space-y-1">
          <p>📱 <strong>Apunta la cámara hacia el código</strong></p>
          <p>🔍 El escaneo es automático</p>
          <p>📋 Soporta QR y códigos de barras</p>
        </div>
      )}
    </div>
  );
};

export default CameraScanner;