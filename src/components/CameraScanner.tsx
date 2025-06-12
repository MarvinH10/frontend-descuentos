import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats, type CameraDevice } from 'html5-qrcode';
import { Camera, CameraOff, Repeat, Lightbulb } from 'lucide-react';

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
  const elementRef = useRef<HTMLDivElement>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        return permission.state === 'granted';
      }
      return true; 
    } catch (error) {
      console.warn('No se pudo verificar permisos de cámara:', error);
      return true;
    }
  };

  const startScanner = useCallback(async () => {
    if (!currentCameraId || !isActive) return;

    setIsInitializing(true);
    setError(null);

    try {
      if (!elementRef.current) {
        throw new Error('Elemento DOM no encontrado');
      }

      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        throw new Error('No hay permisos para acceder a la cámara');
      }

      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {
          console.warn('Error limpiando escáner previo:', e);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      scannerRef.current = new Html5Qrcode("qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE, Html5QrcodeSupportedFormats.CODE_128],
        verbose: false
      });

      const config = {
        fps: 10,
        qrbox: function (viewfinderWidth: number, viewfinderHeight: number) {
          const minEdgePercentage = 0.7;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment"
        }
      };

      await scannerRef.current.start(
        { deviceId: { exact: currentCameraId } },
        config,
        (decodedText: string) => {
          console.log('✅ QR Code escaneado:', decodedText);
          onScanSuccess(decodedText);
        },
        (errorMsg: string) => {
          if (!errorMsg.includes("No QR code found") && !errorMsg.includes("NotFoundException")) {
            console.warn("⚠️ Error de escaneo:", errorMsg);
          }
        }
      );

      setPermissionGranted(true);
    } catch (err) {
      console.error('❌ Error iniciando cámara:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      let userFriendlyMessage = "No se pudo iniciar la cámara";

      if (errorMessage.includes("Permission denied") || errorMessage.includes("NotAllowedError")) {
        userFriendlyMessage = "Permisos de cámara denegados. Por favor, permite el acceso a la cámara y recarga la página.";
        setPermissionGranted(false);
      } else if (errorMessage.includes("NotFoundError") || errorMessage.includes("DevicesNotFoundError")) {
        userFriendlyMessage = "No se encontró ninguna cámara disponible.";
      } else if (errorMessage.includes("NotReadableError") || errorMessage.includes("TrackStartError")) {
        userFriendlyMessage = "La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.";
      } else if (errorMessage.includes("OverconstrainedError")) {
        userFriendlyMessage = "La cámara seleccionada no soporta la configuración requerida.";
      } else if (errorMessage.includes("NotSupportedError")) {
        userFriendlyMessage = "Tu navegador no soporta el acceso a la cámara o no estás usando HTTPS.";
      }

      setError(userFriendlyMessage);
      if (onScanError) onScanError(userFriendlyMessage);
    } finally {
      setIsInitializing(false);
    }
  }, [currentCameraId, isActive, onScanSuccess, onScanError]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.warn("⚠️ Error deteniendo escáner:", err);
        const element = document.getElementById("qr-reader");
        if (element) {
          element.innerHTML = '';
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        startScanner();
      }, 200);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [isActive, currentCameraId, startScanner, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const toggleCamera = async () => {
    if (cameras.length < 2) return;

    await stopScanner();

    const currentIndex = cameras.findIndex((cam) => cam.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setCurrentCameraId(cameras[nextIndex].id);
  };

  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log('📷 Cámaras disponibles:', devices);
        setCameras(devices);

        if (devices.length > 0) {
          const backCamera = devices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
          );
          setCurrentCameraId(backCamera?.id || devices[0].id);
        } else {
          setError("No se encontraron cámaras disponibles.");
        }
      } catch (err) {
        console.error("❌ Error obteniendo cámaras:", err);
        setError("No se pudieron obtener las cámaras disponibles. Asegúrate de estar usando HTTPS y de tener permisos de cámara.");
      }
    };

    getCameras();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={onToggle}
          disabled={isInitializing || !currentCameraId}
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
              {cameras.length === 0 ? 'Sin cámaras' : 'Abrir Cámara'}
            </>
          )}
        </button>

        {isActive && cameras.length > 1 && (
          <button
            onClick={toggleCamera}
            disabled={isInitializing}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          {permissionGranted === false && (
            <div className="mt-2 text-xs">
              <p className="font-medium">Pasos para solucionar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Haz clic en el ícono de cámara en la barra de direcciones</li>
                <li>Selecciona "Permitir siempre"</li>
                <li>Recarga la página</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {isActive && !error && (
        <>
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
            <div
              id="qr-reader"
              ref={elementRef}
              className="w-full"
              style={{ minHeight: '300px' }}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lightbulb className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Consejos para un mejor escaneo:</p>
                <ul className="text-xs space-y-1 text-blue-700 list-disc list-inside">
                  <li>Mantén el código dentro del marco</li>
                  <li>Asegúrate de tener buena iluminación</li>
                  <li>Mantén la cámara estable</li>
                  <li>Si aparece pantalla blanca, recarga la página</li>
                  <li>Verifica que estés usando HTTPS</li>
                  {cameras.length > 1 && <li>Prueba cambiar de cámara si no funciona</li>}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {cameras.length === 0 && !error && (
        <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg">
          <p className="font-medium">Verificando cámaras disponibles...</p>
          <p className="text-sm">Si esto persiste, verifica que tu dispositivo tenga cámara y que esté usando HTTPS.</p>
        </div>
      )}
    </div>
  );
};

export default CameraScanner;