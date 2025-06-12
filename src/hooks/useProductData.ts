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
   * Helper para encontrar la mejor regla en un array de reglas
   */
  const findBestRuleInArray = useCallback((rules: Rule[], quantity: number): { price: number | null; rule: Rule | null } => {
    if (!rules || rules.length === 0) {
      return { price: null, rule: null };
    }

    // Ordenar por min_quantity descendente para obtener la mejor regla aplicable
    const sortedRules = rules.sort((a, b) => b.min_quantity - a.min_quantity);

    for (const rule of sortedRules) {
      if (quantity >= rule.min_quantity) {
        if (rule.fixed_price && rule.fixed_price > 0) {
          return { price: rule.fixed_price, rule };
        }
        if (rule.percent_price && rule.compute_price === 'percentage') {
          const price = state.product!.lst_price * (1 - rule.percent_price / 100);
          return { price, rule };
        }
      }
    }

    return { price: null, rule: null };
  }, [state.product]);

  /**
   * Obtiene el mejor precio para una cantidad específica siguiendo la jerarquía:
   * 1. product_template
   * 2. product_variant
   * 3. category
   * 4. global
   */
  const getBestPrice = useCallback(async (quantity: number = 1): Promise<BestPriceResult> => {
    if (!state.product || !state.lastSearchedBarcode) {
      return { price: null, rule: null };
    }

    if (!state.product.rules_by_application) {
      return { price: state.product.lst_price, rule: null };
    }

    const { rules_by_application } = state.product;

    // Jerarquía de búsqueda
    const hierarchy: (keyof RulesByApplication)[] = [
      'product_template',
      'product_variant',
      'category',
      'global'
    ];

    // Buscar en cada nivel de la jerarquía
    for (const ruleType of hierarchy) {
      const rules = rules_by_application[ruleType];
      if (rules && rules.length > 0) {
        const result = findBestRuleInArray(rules, quantity);
        if (result.price !== null && result.rule !== null) {
          return result;
        }
      }
    }

    // Si no se encuentra ninguna regla aplicable, retornar el precio base
    return { price: state.product.lst_price, rule: null };
  }, [state.product, state.lastSearchedBarcode, findBestRuleInArray]);

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