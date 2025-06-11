import { useState, useCallback } from 'react';
import { odooService } from '../api/odooService';
import type { ProductResponse, Rule, RulesByApplication } from '../api/odooService';

export interface BestPriceResult {
  price: number | null;
  rule: Rule | null;
}

export interface UseProductDataState {
  product: ProductResponse | null;
  loading: boolean;
  error: string | null;
  lastSearchedBarcode: string | null;
}

export interface UseProductDataActions {
  searchProduct: (barcode: string) => Promise<void>;
  searchProductByPost: (barcode: string) => Promise<void>;
  searchProductByGet: (barcode: string) => Promise<void>;
  getBestPrice: (quantity?: number) => Promise<BestPriceResult>;
  getRulesByType: (type: keyof RulesByApplication) => Rule[];
  clearData: () => void;
  clearError: () => void;
}

export interface UseProductDataReturn extends UseProductDataState, UseProductDataActions { }

/**
 * Hook personalizado para manejar datos de productos de Odoo
 * Proporciona estado y acciones para buscar productos y manejar reglas de precios
 */
export const useProductData = (): UseProductDataReturn => {
  const [state, setState] = useState<UseProductDataState>({
    product: null,
    loading: false,
    error: null,
    lastSearchedBarcode: null,
  });

  /**
   * Busca un producto por código de barras usando POST (método por defecto)
   */
  const searchProduct = useCallback(async (barcode: string): Promise<void> => {
    if (!barcode.trim()) {
      setState(prev => ({ ...prev, error: 'El código de barras es requerido' }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastSearchedBarcode: barcode.trim()
    }));

    try {
      const productData = await odooService.getProductByBarcodePost(barcode.trim());
      setState(prev => ({
        ...prev,
        product: productData,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        product: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, []);

  /**
   * Busca un producto usando método POST explícitamente
   */
  const searchProductByPost = useCallback(async (barcode: string): Promise<void> => {
    await searchProduct(barcode);
  }, [searchProduct]);

  /**
   * Busca un producto usando método GET
   */
  const searchProductByGet = useCallback(async (barcode: string): Promise<void> => {
    if (!barcode.trim()) {
      setState(prev => ({ ...prev, error: 'El código de barras es requerido' }));
      return;
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      lastSearchedBarcode: barcode.trim()
    }));

    try {
      const productData = await odooService.getProductByBarcodeGet(barcode.trim());
      setState(prev => ({
        ...prev,
        product: productData,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        product: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }));
    }
  }, []);

  /**
   * Obtiene el mejor precio para una cantidad específica
   */
  const getBestPrice = useCallback(async (quantity: number = 1): Promise<{ price: number | null; rule: Rule | null }> => {
    if (!state.product || !state.lastSearchedBarcode) {
      return { price: null, rule: null };
    }

    const rules = [
      ...state.product.rules_by_application.product_variant,
      ...state.product.rules_by_application.product_template,
      ...state.product.rules_by_application.category,
      ...state.product.rules_by_application.global,
    ];

    const sorted = rules.sort((a, b) => b.min_quantity - a.min_quantity);

    for (const rule of sorted) {
      if (quantity >= rule.min_quantity) {
        if (rule.fixed_price && rule.fixed_price > 0) {
          return { price: rule.fixed_price, rule };
        }
        if (rule.percent_price && rule.compute_price === 'percentage') {
          const price = state.product.lst_price * (1 - rule.percent_price / 100);
          return { price, rule };
        }
      }
    }

    return { price: state.product.lst_price, rule: null };
  }, [state.product, state.lastSearchedBarcode]);

  const getRulesByType = useCallback((type: keyof RulesByApplication): Rule[] => {
    if (!state.product) return [];
    return state.product.rules_by_application[type] || [];
  }, [state.product]);

  /**
   * Limpia todos los datos del estado
   */
  const clearData = useCallback((): void => {
    setState({
      product: null,
      loading: false,
      error: null,
      lastSearchedBarcode: null,
    });
  }, []);

  /**
   * Limpia solo el error del estado
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    product: state.product,
    loading: state.loading,
    error: state.error,
    lastSearchedBarcode: state.lastSearchedBarcode,

    searchProduct,
    searchProductByPost,
    searchProductByGet,
    getBestPrice,
    getRulesByType,
    clearData,
    clearError,
  };
};