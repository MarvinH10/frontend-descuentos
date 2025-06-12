import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertCircle, Wifi, WifiOff, Clock, Camera } from 'lucide-react';
import { useProductData } from '../hooks/useProductData';
import { useServerStatus } from '../hooks/useServerStatus';
import { useSearchHistory } from '../hooks/useLocalStorage';
import QRCapture from '../components/QRCapture';
import ProductInfo from '../components/ProductInfo';

const Home: React.FC = () => {
    const [isCameraActive, setIsCameraActive] = useState(false);
    // Cantidad fija en 1
    const quantity = 1;
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

    // Manejar la detección de un nuevo código QR
    const handleCodeDetected = useCallback((code: string) => {
        // Desactivar la cámara automáticamente al detectar un código
        setIsCameraActive(false);
        
        // Buscar el producto inmediatamente
        if (isOnline && !loading) {
            searchProduct(code);
            addToHistory(code);
        }
    }, [isOnline, loading, searchProduct, addToHistory, setIsCameraActive]);

    // Ya no necesitamos las funciones de manejo de lista de productos

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

                <div className="mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
                        <h2 className="text-lg font-medium mb-4">Escáner QR</h2>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                                <p className="text-gray-600 font-medium">Buscando producto...</p>
                            </div>
                        ) : !product ? (
                            <QRCapture
                                onCodeDetected={handleCodeDetected}
                                isActive={isCameraActive}
                                onToggle={() => setIsCameraActive(!isCameraActive)}
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    clearData();
                                    setIsCameraActive(true);
                                }}
                                className="w-full px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                            >
                                <Camera className="w-4 h-4" />
                                Escanear otro producto
                            </button>
                        )}
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

export default Home;