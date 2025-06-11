import React from 'react';
import { CheckCircle, TrendingDown } from 'lucide-react';
import type { Rule } from '../api/odooService';

interface Product {
    product_name: string;
    barcode: string;
    lst_price: number;
    total_rules: number;
}

type RuleType = 'product_variant' | 'product_template' | 'category' | 'global';

interface ProductInfoProps {
    product: Product;
    quantity: number | string;
    bestPrice: number | null;
    getRulesByType: (type: RuleType) => Rule[];
    onClearData: () => void;
    appliedRule?: { fixed_price?: number; percent_price?: number };
    loading?: boolean;
}

// const RuleCard: React.FC<{ title: string; rules: Rule[]; color: string }> = ({ title, rules, color }) => {
//     if (rules.length === 0) return null;

//     return (
//         <div className={`bg-white rounded-lg border-l-4 ${color} shadow-sm p-4`}>
//             <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
//                 <Tag className="w-4 h-4" />
//                 {title} ({rules.length})
//             </h3>
//             <div className="space-y-2">
//                 {rules.map((rule, index) => (
//                     <div key={rule.id || index} className="bg-gray-50 p-3 rounded border">
//                         <div className="grid grid-cols-2 gap-2 text-sm">
//                             <span className="text-gray-600">Cantidad mínima:</span>
//                             <span className="font-medium">{rule.min_quantity}</span>

//                             {rule.fixed_price && (
//                                 <>
//                                     <span className="text-gray-600">Precio fijo:</span>
//                                     <span className="font-medium text-green-600">S/ {rule.fixed_price.toFixed(2)}</span>
//                                 </>
//                             )}

//                             {rule.percent_price && (
//                                 <>
//                                     <span className="text-gray-600">Descuento:</span>
//                                     <span className="font-medium text-blue-600">{rule.percent_price}%</span>
//                                 </>
//                             )}

//                             {rule.pricelist_id && (
//                                 <>
//                                     <span className="text-gray-600">Lista de precios:</span>
//                                     <span className="font-medium">{rule.pricelist_id[1]}</span>
//                                 </>
//                             )}
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

const ProductInfo: React.FC<ProductInfoProps> = ({
    product,
    quantity,
    bestPrice,
    // getRulesByType,
    onClearData,
    appliedRule,
    loading
}) => {
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <div className="h-5 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                                <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                        <div>
                            <div className="h-5 w-40 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-8 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="text-center">
                    <div className="inline-block h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-gray-900">Producto encontrado!</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2">Información del producto</h3>
                        <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-600">Nombre:</span>
                                <span className="col-span-2 font-medium">{product.product_name}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-600">Código:</span>
                                <span className="col-span-2 font-mono">{product.barcode}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-600">Precio base:</span>
                                <span className="col-span-2 font-medium">S/ {product.lst_price.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-gray-600">Total reglas:</span>
                                <span className="col-span-2 font-medium">{product.total_rules}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-green-600" />
                            Mejor precio (Cantidad: {quantity})
                        </h3>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 relative">
                            {appliedRule && (appliedRule.fixed_price || appliedRule.percent_price) && (
                                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold shadow">
                                    {appliedRule.fixed_price
                                        ? `Precio fijo: S/ ${appliedRule.fixed_price.toFixed(2)}`
                                        : `Descuento: ${appliedRule.percent_price}%`}
                                </div>
                            )}
                            <div className="text-2xl font-bold text-green-800">
                                Precio total: S/ {((bestPrice || product.lst_price) * Number(quantity)).toFixed(2)}
                            </div>
                            <div className="text-lg text-green-700 font-semibold mt-1">
                                Precio x unidad: S/ {bestPrice?.toFixed(2) || product.lst_price.toFixed(2)}
                            </div>
                            {bestPrice && bestPrice < product.lst_price && (
                                <div className="text-sm text-green-600 mt-2">
                                    Ahorro total: S/ {((product.lst_price - bestPrice) * Number(quantity)).toFixed(2)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Reglas de precios */}
            {/*<div className="grid lg:grid-cols-2 gap-6">
                <RuleCard
                    title="Reglas de Variante"
                    rules={getRulesByType('product_variant')}
                    color="border-l-purple-500"
                />
                <RuleCard
                    title="Reglas de Plantilla"
                    rules={getRulesByType('product_template')}
                    color="border-l-blue-500"
                />
                <RuleCard
                    title="Reglas de Categoría"
                    rules={getRulesByType('category')}
                    color="border-l-orange-500"
                />
                <RuleCard
                    title="Reglas Globales"
                    rules={getRulesByType('global')}
                    color="border-l-green-500"
                />
            </div>
            */}

            <div className="text-center">
                <button
                    onClick={onClearData}
                    className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 cursor-pointer"
                >
                    Nueva Búsqueda
                </button>
            </div>
        </div>
    );
};

export default ProductInfo;