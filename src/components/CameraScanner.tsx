import React, { useState, useEffect, useCallback } from 'react';
import { QrReader } from 'react-qr-reader';
import {
  Camera,
  Search,
  CheckCircle,
  RefreshCw,
  XCircle,
  BarChart2,
  Lightbulb
} from 'lucide-react';

type QRReaderResult = { getText: () => string };

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
  const [lastScan, setLastScan] = useState<string>('');
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop());
        setCameraReady(true);
      })
      .catch(err => {
        console.error('Permiso cámara fallido:', err);
        onScanError?.('Permiso denegado. Ve la configuración de tu navegador.');
      });
  }, [onScanError]);

  const handleResult = useCallback((
    result: QRReaderResult | null | undefined,
    error?: Error | null
  ) => {
    if (error) {
      const msg = error.message || 'Error desconocido del escáner';
      if (!msg.includes('No QR code found')) {
        onScanError?.(
          msg.includes('Permission dismissed')
            ? 'Permiso de cámara denegado por el usuario.'
            : msg
        );
      }
      return;
    }

    if (result && isScanning) {
      const scannedText = result.getText();
      if (scannedText && scannedText !== lastScan) {
        console.log('Código QR escaneado:', scannedText);
        setLastScan(scannedText);
        setIsScanning(false);
        setScanCount(c => c + 1);
        onScanSuccess(scannedText);
        setTimeout(() => setIsScanning(true), 2000);
      }
    }
  }, [isScanning, lastScan, onScanSuccess, onScanError]);

  const toggleCamera = () => {
    setFacingMode(fm => (fm === 'user' ? 'environment' : 'user'));
  };

  const resetScanner = () => {
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
        <QrReader
          onResult={handleResult}
          constraints={{
            facingMode: { ideal: facingMode }
          }}
          containerStyle={{ width: '100%', height: '100%' }}
          videoContainerStyle={{ width: '100%', height: '100%', paddingTop: 0 }}
          videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-1/4 border-2 border-white rounded-lg shadow-lg">
            {isScanning && <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-400 animate-pulse" />}
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