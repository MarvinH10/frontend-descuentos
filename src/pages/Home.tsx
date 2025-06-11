import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Wifi, WifiOff, Clock } from 'lucide-react';
import { useProductData } from '../hooks/useProductData';
import { useServerStatus } from '../hooks/useServerStatus';
import { useSearchHistory } from '../hooks/useLocalStorage';
import QRScanner from '../components/QRScanner';
import ProductInfo from '../components/ProductInfo';

const Home: React.FC = () => {
    const [barcode, setBarcode] = useState('');
    const [quantity, setQuantity] = useState<number | string>(1);
    const [bestPrice, setBestPrice] = useState<number | null>(null);
    const [appliedRule, setAppliedRule] = useState<{ fixed_price?: number; percent_price?: number } | null>(null);

    const {
        product,
        loading,
        error,
        searchProduct,
        getBestPrice,
        // getRulesByType,
        clearData,
        clearError
    } = useProductData();

    const { isOnline, lastChecked } = useServerStatus();
    const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!barcode.trim()) return;

        await searchProduct(barcode.trim());
        addToHistory(barcode.trim());
    };

    useEffect(() => {
        if (product) {
            getBestPrice(Number(quantity)).then(price => {
                setBestPrice(price);

                const rules = [
                    ...product.rules_by_application.product_variant,
                    ...product.rules_by_application.product_template,
                    ...product.rules_by_application.category,
                    ...product.rules_by_application.global
                ].sort((a, b) => b.min_quantity - a.min_quantity);

                const rule = rules.find(r => Number(quantity) >= r.min_quantity);
                if (rule?.compute_price === 'percentage' && rule.percent_price) {
                    setAppliedRule({ percent_price: rule.percent_price });
                } else if (rule?.fixed_price) {
                    setAppliedRule({ fixed_price: rule.fixed_price });
                } else {
                    setAppliedRule(null);
                }
            });
        }
    }, [product, quantity, getBestPrice]);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-700 mb-2 flex items-center justify-center gap-3">
                        <Package className="w-8 h-8 text-gray-700" />
                        Escanea tu producto
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

                <QRScanner
                    barcode={barcode}
                    setBarcode={setBarcode}
                    quantity={quantity}
                    setQuantity={setQuantity}
                    loading={loading}
                    isOnline={isOnline}
                    history={history}
                    onSearch={handleSearch}
                    onClearHistory={clearHistory}
                    onRemoveFromHistory={removeFromHistory}
                />

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
                        quantity={Number(quantity)}
                        bestPrice={bestPrice}
                        loading={loading}
                        appliedRule={appliedRule ?? undefined}
                        onClearData={clearData}
                    />
                )}
            </div>
        </div>
    );
};

export default Home;