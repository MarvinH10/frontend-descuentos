import React from "react";
import type { Rule } from "../api/odooService";

interface Product {
  product_name: string;
  barcode: string;
  lst_price: number;
  total_rules: number;
  rules_by_application?: {
    global: Rule[];
    category: Rule[];
    product_template: Rule[];
    product_variant: Rule[];
  };
}

interface ProductInfoProps {
  product: Product;
  quantity: number | string;
  bestPrice: number | null;
  onClearData: () => void;
  appliedRule?: { fixed_price?: number; percent_price?: number };
  loading?: boolean;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  quantity,
  bestPrice,
  appliedRule,
  loading,
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
    <>
      <div className="bg-transparent p-6 text-center space-y-2" style={{ boxShadow: 'none', border: 'none', marginTop: '-3.5rem' }}>
        {/* Nombre del producto */}
        <div className="text-lg font-medium" style={{ color: '#0097D4' }}>
          {product.product_name || "N/A"}
        </div>

        {/* Precio base */}
        <div className="text-base" style={{ color: '#0097D4' }}>
          S/ {product.lst_price?.toFixed(2) || "0.00"}
        </div>

        {/* Texto de descuento */}
        <div className="text-white bg-green-600 rounded px-3 py-1 inline-block text-lg">
          DESCT. {appliedRule?.percent_price?.toFixed(0) || 0}%
        </div>

        {/* Precio con descuento */}
        <div className="font-bold" style={{ color: '#0097D4', fontSize: '3.5rem' }}>
          S/ {((bestPrice ?? product.lst_price) * Number(quantity)).toFixed(2)}
        </div>
      </div>
    </>
  );
};

export default ProductInfo;
