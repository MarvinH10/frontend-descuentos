import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Wifi, WifiOff, Clock } from 'lucide-react';
import { useProductData } from '../hooks/useProductData';
import { useServerStatus } from '../hooks/useServerStatus';
import { useSearchHistory } from '../hooks/useLocalStorage';
import QRScanner from '../components/QRScanner';
import ProductInfo from '../components/ProductInfo';
import toast, { Toaster } from 'react-hot-toast';
import type { Rule } from '../api/odooService';

const Home: React.FC = () => {
    const [barcode, setBarcode] = useState('');
    const [quantity, setQuantity] = useState<number | string>(1);
    const [bestPrice, setBestPrice] = useState<number | null>(null);
    const [appliedRule, setAppliedRule] = useState<{ fixed_price?: number; percent_price?: number }>();
    const [discountToastIds, setDiscountToastIds] = useState<string[]>([]);

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
    const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

    const clearDiscountToasts = () => {
        discountToastIds.forEach(id => toast.remove(id));
        setDiscountToastIds([]);
    };

    const handleSearch = async (
        e: React.FormEvent | { preventDefault: () => void },
        customBarcode?: string
    ): Promise<void> => {
        e.preventDefault();
        clearDiscountToasts();
        const codeToSearch = customBarcode || barcode.trim();
        if (!codeToSearch) return;

        setQuantity(1);
        
        await searchProduct(codeToSearch);
        addToHistory(codeToSearch);
    };

    useEffect(() => {
        const calculateBestPrice = async () => {
            if (product && quantity) {
                try {
                    const result = await getBestPrice(Number(quantity));
                    setBestPrice(result.price);

                    if (result.rule) {
                        setAppliedRule({
                            fixed_price: result.rule.fixed_price,
                            percent_price: result.rule.percent_price
                        });
                    } else {
                        setAppliedRule(undefined);
                    }
                } catch (error) {
                    console.error('Error calculando el mejor precio:', error);
                    setBestPrice(product.lst_price);
                    setAppliedRule(undefined);
                }
            } else {
                setBestPrice(null);
                setAppliedRule(undefined);
            }
        };

        calculateBestPrice();
    }, [product, quantity, getBestPrice]);

    useEffect(() => {
        if (!product) {
            setBestPrice(null);
            setAppliedRule(undefined);
        }
    }, [product]);

    useEffect(() => {
        if (product && product.rules_by_application) {
            const allRules = [
                ...product.rules_by_application.product_template,
                ...product.rules_by_application.product_variant,
                ...product.rules_by_application.category,
                ...product.rules_by_application.global,
            ];
            const futureDiscounts = allRules.filter(rule => rule.min_quantity > 1);

            toast.remove();

            if (futureDiscounts.length > 0) {
                showDiscountToasts(futureDiscounts);
            }
        }
    }, [product]);

    const showDiscountToasts = (rules: Rule[]) => {
        const ids: string[] = [];
        rules.forEach(rule => {
            const id = `discount-${rule.id || rule.min_quantity}-${rule.fixed_price || rule.percent_price}`;
            ids.push(id);
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
                        className="text-[10px] text-gray-500 underline self-end cursor-pointer"
                        style={{ marginTop: '5px' }}
                        onClick={() => toast.remove(t.id)}
                    >
                        Cerrar
                    </button>
                </div>
            ), { id, duration: Infinity });
        });
        setDiscountToastIds(ids);
    };

    const handleClearAll = () => {
        clearDiscountToasts();
        clearData();
        setBarcode('');
    };

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
                        onClearData={handleClearAll}
                        appliedRule={appliedRule}
                        loading={loading}
                    />
                )}
            </div>
            <Toaster position="top-right" />
        </div>
    );
};

export default Home;
