import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertCircle, Wifi, WifiOff, Clock } from 'lucide-react';
import { useProductData } from '../hooks/useProductData';
import { useServerStatus } from '../hooks/useServerStatus';
import { useSearchHistory } from '../hooks/useLocalStorage';
import QRCapture from '../components/QRCapture';
import ScannedItemsList from '../components/ScannedItemsList';
import ProductInfo from '../components/ProductInfo';

interface ScannedItem {
  code: string;
  timestamp: number;
  status: 'pending' | 'searching' | 'found' | 'error';
  error?: string;
}

const ScannerPage: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [bestPrice, setBestPrice] = useState<number | null>(null);
  const [appliedRule, setAppliedRule] = useState<{ fixed_price?: number; percent_price?: number }>();

  const {
    product,
    loading,
    error,
    searchProduct,
    getBestPrice,
    clearData,
    clearError
  } = useProductData();

  const { isOnline, lastChecked } = useServerStatus();
  const { addToHistory } = useSearchHistory();

  const handleCodeDetected = useCallback((code: string) => {
    setScannedItems(prev => {
      if (prev.some(item => item.code === code)) {
        return prev;
      }
      return [{
        code,
        timestamp: Date.now(),
        status: 'pending'
      }, ...prev];
    });
  }, []);

  const searchSingleProduct = useCallback(async (code: string) => {
    if (!isOnline || loading) return;

    setScannedItems(prev =>
      prev.map(item =>
        item.code === code
          ? { ...item, status: 'searching' }
          : item
      )
    );

    try {
      await searchProduct(code);
      addToHistory(code);

      setScannedItems(prev =>
        prev.map(item =>
          item.code === code
            ? { ...item, status: 'found' }
            : item
        )
      );
    } catch (err) {
      setScannedItems(prev =>
        prev.map(item =>
          item.code === code
            ? {
              ...item,
              status: 'error',
              error: err instanceof Error ? err.message : 'Error desconocido'
            }
            : item
        )
      );
    }
  }, [isOnline, loading, searchProduct, addToHistory]);

  const searchAllPendingProducts = useCallback(async () => {
    const pendingItems = scannedItems.filter(item => item.status === 'pending');
    if (pendingItems.length === 0 || !isOnline || loading) return;

    await searchSingleProduct(pendingItems[0].code);
  }, [scannedItems, isOnline, loading, searchSingleProduct]);

  const removeScannedItem = useCallback((code: string) => {
    setScannedItems(prev => prev.filter(item => item.code !== code));
  }, []);

  const clearAllScannedItems = useCallback(() => {
    setScannedItems([]);
  }, []);

  useEffect(() => {
    if (product) {
      getBestPrice(quantity).then(({ price, rule }) => {
        setBestPrice(price);
        setAppliedRule(rule || undefined);
      });
    }
  }, [product, quantity, getBestPrice]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-600" />
            <span className="ml-2">Escanea tus productos</span>
          </h1>
          <p className="text-gray-600">Busca productos por QR y consulta sus precios</p>

          <div className="flex items-center justify-center gap-2 mt-4">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Servidor conectado</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Servidor desconectado</span>
              </div>
            )}
            {lastChecked && (
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <Clock className="w-3 h-3" />
                {lastChecked.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium mb-4">Escáner QR</h2>
              <QRCapture
                onCodeDetected={handleCodeDetected}
                isActive={isCameraActive}
                onToggle={() => setIsCameraActive(!isCameraActive)}
              />

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <ScannedItemsList
              items={scannedItems}
              onSearch={searchSingleProduct}
              onSearchAll={searchAllPendingProducts}
              onRemove={removeScannedItem}
              onClearAll={clearAllScannedItems}
              isLoading={loading}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {product && (
          <ProductInfo
            product={product}
            quantity={quantity}
            bestPrice={bestPrice}
            onClearData={clearData}
            appliedRule={appliedRule}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
};

export default ScannerPage;