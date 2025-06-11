import React, { useState, useEffect, useCallback, useRef } from 'react';
import QrScanner from 'react-qr-scanner';
import {
  Camera,
  Search,
  CheckCircle,
  RefreshCw,
  XCircle,
  BarChart2,
  Lightbulb
} from 'lucide-react';

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
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isScanning, setIsScanning] = useState(true);
  const [lastScan, setLastScan] = useState('');
  const [scanCount, setScanCount] = useState(0);

  const lastRef = useRef<string>('');

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(t => t.stop());
        setCameraReady(true);
      })
      .catch(() => {
        onScanError?.('Permiso denegado. Revisa la configuración de tu navegador.');
      });
  }, [onScanError]);

  const handleScan = useCallback((data: string | null) => {
    if (!isScanning) return;
    if (data && data !== lastRef.current) {
      lastRef.current = data;
      setLastScan(data);
      setIsScanning(false);
      setScanCount(c => c + 1);
      onScanSuccess(data);
      setTimeout(() => {
        lastRef.current = '';
        setIsScanning(true);
      }, 2000);
    }
  }, [isScanning, onScanSuccess]);

  const handleError = useCallback((err: Error) => {
    console.error(err);
    onScanError?.(err.message);
  }, [onScanError]);

  const toggleCamera = () => {
    setFacingMode(fm => fm === 'user' ? 'environment' : 'user');
  };

  const resetScanner = () => {
    lastRef.current = '';
    setIsScanning(true);
    setLastScan('');
  };

  if (!isActive) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <button
          onClick={onToggle}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Camera className="w-5 h-5 mr-2" />
          Activar Escáner QR
        </button>
        <p className="text-gray-500 text-sm mt-3 max-w-sm mx-auto">
          Presiona para activar la cámara y comenzar a escanear códigos
        </p>
      </div>
    );
  }

  if (isActive && !cameraReady) {
    return (
      <div className="p-4 text-center text-gray-600">
        🔒 Esperando permiso de cámara…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Escáner QR Activo</h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            {isScanning ? (
              <>
                <Search className="w-4 h-4" />
                Buscando código...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                Código detectado
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleCamera} title="Cambiar cámara" className="px-3 py-2 bg-gray-100 rounded-md">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button onClick={onToggle} className="px-4 py-2 bg-red-600 text-white rounded-md">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {scanCount > 0 && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 inline-flex items-center gap-1">
          <BarChart2 className="w-4 h-4" />
          Escaneos: {scanCount}
        </div>
      )}

      <div className="aspect-square max-w-lg mx-auto relative overflow-hidden rounded-lg shadow-sm border border-gray-200">
        <QrScanner
          delay={300}
          facingMode={facingMode}
          onError={handleError}
          onScan={handleScan}
          style={{ width: '100%', height: '100%' }}
          constraints={{ facingMode: { ideal: facingMode } }}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-1/4 border-2 border-white rounded-lg shadow-lg">
            {isScanning && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {lastScan && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start justify-between">
          <div>
            <h4 className="font-medium text-green-800">Último código:</h4>
            <p className="font-mono break-all">{lastScan}</p>
          </div>
          <button onClick={resetScanner} className="px-3 py-1 bg-green-600 text-white rounded flex items-center gap-1">
            <RefreshCw className="w-4 h-4" />
            Nuevo
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Lightbulb className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Consejos para un mejor escaneo:</p>
            <ul className="text-xs space-y-1 text-blue-700 list-disc list-inside">
              <li>Mantén el código dentro del marco blanco</li>
              <li>Asegúrate de tener buena iluminación</li>
              <li>Mantén la cámara estable</li>
              <li>Si no funciona, prueba cambiar de cámara con el botón de recarga</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
