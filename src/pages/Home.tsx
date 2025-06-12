import React, { useState, useEffect, useCallback } from 'react';
import { Package, AlertCircle, Wifi, WifiOff, Clock, Camera } from 'lucide-react';
import { useProductData } from '../hooks/useProductData';
import { useServerStatus } from '../hooks/useServerStatus';
import { useSearchHistory } from '../hooks/useLocalStorage';
import QRCapture from '../components/QRCapture';
import ProductInfo from '../components/ProductInfo';
import toast, { Toaster } from 'react-hot-toast';
import type { Rule } from '../api/odooService';

const Home: React.FC = () => {
    const [isCameraActive, setIsCameraActive] = useState(false);
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
        setIsCameraActive(false);

        if (isOnline && !loading) {
            searchProduct(code);
            addToHistory(code);
        }
    }, [isOnline, loading, searchProduct, addToHistory, setIsCameraActive]);

    useEffect(() => {
        if (product) {
            getBestPrice(quantity).then(({ price, rule }) => {
                setBestPrice(price);
                setAppliedRule(rule || undefined);
            });
        }
    }, [product, quantity, getBestPrice]);

    useEffect(() => {
        if (product?.rules_by_application) {
            const allRules: Rule[] = [
                ...product.rules_by_application.product_template,
                ...product.rules_by_application.product_variant,
                ...product.rules_by_application.category,
                ...product.rules_by_application.global,
            ];
            const futureDiscounts = allRules.filter((r: Rule) => r.min_quantity > 1);
            toast.remove();
            futureDiscounts.forEach(rule => {
                const id = `discount-${rule.id || rule.min_quantity}-${rule.fixed_price || rule.percent_price}`;
                toast.custom((t) => (
                    <div className="bg-white border border-green-400 rounded shadow p-2 flex flex-col gap-1 min-w-[180px] max-w-[240px]">
                        <div className="text-xs flex items-center gap-1">
                            <span role="img" aria-label="idea">💡</span>
                            {rule.fixed_price && rule.fixed_price > 0
                                ? <><b>Con {rule.min_quantity}</b>u. a <b>S/ {rule.fixed_price.toFixed(2)}</b></>
                                : rule.percent_price && rule.percent_price > 0
                                    ? <><b>Con {rule.min_quantity}</b>u. <b>{rule.percent_price}% desc.</b></>
                                    : null
                            }
                        </div>
                        <button
                            className="bg-green-500 hover:bg-green-600 text-white rounded text-xs px-2 py-1 font-semibold mt-1 cursor-pointer"
                            style={{ lineHeight: '1.1' }}
                            onClick={() => {
                                setQuantity(rule.min_quantity);
                                toast.remove(t.id);
                            }}
                        >
                            Ver x {rule.min_quantity} unidades
                        </button>
                        <button
                            className="text-[10px] text-gray-500 underline self-end mt-1 cursor-pointer"
                            onClick={() => toast.remove(t.id)}
                        >
                            Cerrar
                        </button>
                    </div>
                ), { id, duration: Infinity });
            });
        }
    }, [product]);

    const handleClearAll = () => {
        toast.remove();
        clearData();
        setIsCameraActive(false);
        setQuantity(1);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Toaster position="top-right" />
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
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mb-4"></div>
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
                                onClick={handleClearAll}
                                className="cursor-pointer w-full px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center gap-2"
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
                            className="text-red-600 hover:text-red-800 text-sm underline cursor-pointer"
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
                        onClearData={handleClearAll}
                        appliedRule={appliedRule}
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
};

export default Home;