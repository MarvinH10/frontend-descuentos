import React, { useState, useEffect } from 'react';
import { Search, X, Camera } from 'lucide-react';
import QrScanner from 'react-qr-barcode-scanner';

type QRScanResult = {
  text: string;
  format: string;
};

interface QRScannerProps {
  barcode: string;
  setBarcode: (value: string) => void;
  quantity: number | string;
  setQuantity: (value: number | string) => void;
  loading: boolean;
  isOnline: boolean;
  history: string[];
  onSearch: (e: React.FormEvent) => void;
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
        className="ml-1 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center cursor-pointer"
        aria-label={`Eliminar ${item} del historial`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
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
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (isMobileDevice()) {
      setShowScanner(true);
    }
  }, []);

  const handleScan = (result?: unknown) => {
    const text = result && typeof result === 'object' && 'text' in result
      ? (result as QRScanResult).text
      : '';
    if (text) {
      setBarcode(text);
      setShowScanner(false);
      setTimeout(() => {
        const fakeEvent = { preventDefault: () => { } } as React.FormEvent;
        onSearch(fakeEvent);
      }, 100);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1 border border-gray-200 rounded-lg"
          onClick={() => setShowScanner((prev) => !prev)}
        >
          <Camera className="w-4 h-4" />
          {showScanner ? 'Ingresar manualmente' : 'Escanear QR'}
        </button>
      </div>
      {showScanner ? (
        <div className="mb-4">
          <div style={{ width: '100%' }}>
            <QrScanner
              onUpdate={(_err, result) => {
                handleScan(result);
              }}
              facingMode="environment"
            />
          </div>
          <div className="text-xs text-gray-500 text-center mt-2">Apunta la cámara al código de barras o QR</div>
        </div>
      ) : (
        <form onSubmit={onSearch} className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:gap-4">
            <div className="flex-1">
              <label htmlFor="barcode" className="block text-sm font-medium text-gray-700 mb-2">
                Código de barras
              </label>
              <input
                id="barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ingresa el código de barras..."
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
                onChange={(e) => {
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
                className="w-full md:w-auto cursor-pointer px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center gap-2 mt-2 md:mt-0"
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
              className="text-xs text-red-600 hover:bg-red-200 cursor-pointer bg-red-100 px-3 py-2 rounded-lg"
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