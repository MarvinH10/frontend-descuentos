import React, { useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import CameraScanner from './CameraScanner';

interface QRScannerProps {
  barcode: string;
  setBarcode: (value: string) => void;
  quantity: number | string;
  setQuantity: (value: number | string) => void;
  loading: boolean;
  isOnline: boolean;
  history: string[];
  onSearch: (e: React.FormEvent | { preventDefault: () => void }, scannedText?: string) => void;
  onClearHistory: () => void;
  onRemoveFromHistory: (item: string) => void;
}


const SearchHistoryItem: React.FC<{
  item: string;
  onClick: () => void;
  onRemove: () => void;
}> = ({ item, onClick, onRemove }) => {
  return (
    <div className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full flex items-center gap-1">
      <span
        onClick={onClick}
        className="cursor-pointer select-none"
      >
        {item}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="ml-1 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center"
        aria-label={`Eliminar ${item} del historial`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const QRScanner: React.FC<QRScannerProps> = ({
  barcode,
  setBarcode,
  quantity,
  setQuantity,
  loading,
  isOnline,
  history,
  onSearch,
  onClearHistory,
  onRemoveFromHistory
}) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('camera');
  const [isAutoSearching, setIsAutoSearching] = useState(false);

  const handleScanSuccess = async (scannedText: string) => {
    console.log('🔍 Código QR escaneado:', scannedText);

    setBarcode(scannedText);

    setIsCameraActive(false);

    setIsAutoSearching(true);

    const fakeEvent = { preventDefault: () => { } } as React.FormEvent;

    try {
      onSearch(fakeEvent, scannedText);
    } catch (error) {
      console.error('❌ Error en búsqueda automática:', error);
    } finally {
      setIsAutoSearching(false);
    }
  };

  const handleScanError = (error: string) => {
    console.error('Error de escaneo QR:', error);
  };

  const toggleCamera = () => {
    setIsCameraActive(!isCameraActive);
  };

  const handleNewScan = () => {
    setBarcode('');
    setIsCameraActive(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="mb-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => {
              setScanMode('camera');
              if (!barcode) {
                setIsCameraActive(true);
              }
            }}
            className={`cursor-pointer flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${scanMode === 'camera'
              ? 'bg-white text-gray-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            📱 Escanear QR
          </button>
          <button
            onClick={() => {
              setScanMode('manual');
              setIsCameraActive(false);
            }}
            className={`cursor-pointer flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${scanMode === 'manual'
              ? 'bg-white text-gray-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            ⌨️ Entrada Manual
          </button>
        </div>
      </div>

      {scanMode === 'camera' && (
        <div className="space-y-4">
          {barcode && !isCameraActive && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">✅ Código QR escaneado:</p>
                  <p className="text-lg font-mono text-green-900 break-all">{barcode}</p>
                  {(isAutoSearching || loading) && (
                    <p className="text-sm text-gray-600 mt-1 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Buscando producto
                    </p>
                  )}
                  {!isAutoSearching && !loading && (
                    <p className="text-sm text-green-600 mt-1">✅ Búsqueda completada</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={handleNewScan}
                    disabled={isAutoSearching || loading}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 whitespace-nowrap"
                  >
                    Escanear otro
                  </button>
                </div>
              </div>
            </div>
          )}

          <CameraScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
            isActive={isCameraActive}
            onToggle={toggleCamera}
          />

          <div className="flex justify-center">
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Cantidad
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "") {
                    setQuantity("");
                  } else {
                    setQuantity(Math.max(1, parseInt(val) || 1));
                  }
                }}
                onBlur={() => {
                  if (quantity === "") setQuantity(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0 focus:ring-gray-400 focus:outline-none text-center"
                disabled={isAutoSearching || loading}
              />
            </div>
          </div>
        </div>
      )}

      {scanMode === 'manual' && (
        <form onSubmit={onSearch} className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:gap-4">
            <div className="flex-1">
              <label htmlFor="qrcode" className="block text-sm font-medium text-gray-700 mb-2">
                Código QR
              </label>
              <input
                id="qrcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ingresa o pega el código QR..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0 focus:ring-gray-400 focus:outline-none"
                disabled={loading}
              />
            </div>
            <div className="w-full md:w-32">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => {
                  const val = e.target.value;
                  if (val === "") {
                    setQuantity("");
                  } else {
                    setQuantity(Math.max(1, parseInt(val) || 1));
                  }
                }}
                onBlur={() => {
                  if (quantity === "") setQuantity(1);
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 focus:border-gray-400 focus:ring-0 focus:ring-gray-400 focus:outline-none"
              />
            </div>
            <div className="flex md:flex-col justify-end w-full md:w-auto">
              <button
                type="submit"
                disabled={loading || !barcode.trim() || !isOnline}
                className="w-full md:w-auto cursor-pointer px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 md:mt-0"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Buscando' : 'Buscar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Búsquedas recientes</h3>
            <button
              onClick={onClearHistory}
              className="text-xs text-red-600 hover:bg-red-300 rounded-lg px-2 py-1 bg-red-200 cursor-pointer"
            >
              Limpiar historial
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 5).map((item, index) => (
              <SearchHistoryItem
                key={index}
                item={item}
                onClick={() => setBarcode(item)}
                onRemove={() => onRemoveFromHistory(item)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;