import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

export interface Rule {
    id?: number;
    min_quantity: number;
    fixed_price?: number;
    percent_price?: number;
    compute_price?: string;
    pricelist_id?: [number, string];
    product_name?: string;
    applied_on?: string;
    categ_id?: [number, string] | false;
    product_tmpl_id?: [number, string] | false;
    product_id?: [number, string] | false;
}

export interface RulesByApplication {
    global: Rule[];
    category: Rule[];
    product_template: Rule[];
    product_variant: Rule[];
}

export interface ProductResponse {
    success: boolean;
    barcode: string;
    product_name: string;
    lst_price: number;
    rules_by_application: RulesByApplication;
    total_rules: number;
    error?: string;
}

export interface BarcodeRequest {
    barcode: string;
}

class OdooService {
    private baseURL: string;

    constructor() {
        this.baseURL = BACKEND_URL || 'http://localhost:3001';
    }

    /**
     * Obtiene información del producto por código de barras usando POST
     * @param barcode - Código de barras del producto
     * @returns Promise con la información del producto y sus reglas de precios
     */
    async getProductByBarcodePost(barcode: string): Promise<ProductResponse> {
        try {
            const response = await axios.post<ProductResponse>(
                `${this.baseURL}/product-by-barcode`,
                { barcode } as BarcodeRequest,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            const data = response.data;
            if (data.success && !data.rules_by_application) {
                data.rules_by_application = {
                    global: [],
                    category: [],
                    product_template: [],
                    product_variant: []
                };
            }

            return data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new Error('Producto no encontrado');
                }

                if (error.response?.data?.error) {
                    throw new Error(error.response.data.error);
                }

                throw new Error(`Error del servidor: ${error.response?.status || 'Conexión fallida'}`);
            }

            throw new Error('Error inesperado al buscar el producto');
        }
    }

    /**
     * Obtiene información del producto por código de barras usando GET
     * @param barcode - Código de barras del producto
     * @returns Promise con la información del producto y sus reglas de precios
     */
    async getProductByBarcodeGet(barcode: string): Promise<ProductResponse> {
        try {
            const response = await axios.get<ProductResponse>(
                `${this.baseURL}/product-by-barcode/${encodeURIComponent(barcode)}`
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 404) {
                    throw new Error('Producto no encontrado');
                }

                if (error.response?.data?.error) {
                    throw new Error(error.response.data.error);
                }

                throw new Error(`Error del servidor: ${error.response?.status || 'Conexión fallida'}`);
            }

            throw new Error('Error inesperado al buscar el producto');
        }
    }

    /**
     * Verifica el estado del servidor backend
     * @returns Promise<boolean> - true si el servidor está activo
     */
    async checkServerStatus(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseURL}/`);
            return response.status === 200;
        } catch (error) {
            console.error('Servidor backend no disponible:', error);
            return false;
        }
    }

    /**
     * Obtiene todas las reglas aplicables para un producto específico
     * Método de conveniencia que usa POST por defecto
     * @param barcode - Código de barras del producto
     * @returns Promise con las reglas organizadas por tipo de aplicación
     */
    async getRulesByBarcode(barcode: string): Promise<RulesByApplication> {
        const productData = await this.getProductByBarcodePost(barcode);
        return productData.rules_by_application;
    }

    /**
     * Obtiene solo las reglas globales para un producto
     * @param barcode - Código de barras del producto
     * @returns Promise con array de reglas globales
     */
    async getGlobalRules(barcode: string): Promise<Rule[]> {
        const rules = await this.getRulesByBarcode(barcode);
        return rules.global;
    }

    /**
     * Obtiene solo las reglas de categoría para un producto
     * @param barcode - Código de barras del producto
     * @returns Promise con array de reglas de categoría
     */
    async getCategoryRules(barcode: string): Promise<Rule[]> {
        const rules = await this.getRulesByBarcode(barcode);
        return rules.category;
    }

    /**
     * Obtiene solo las reglas de plantilla de producto
     * @param barcode - Código de barras del producto
     * @returns Promise con array de reglas de plantilla
     */
    async getProductTemplateRules(barcode: string): Promise<Rule[]> {
        const rules = await this.getRulesByBarcode(barcode);
        return rules.product_template;
    }

    /**
     * Obtiene solo las reglas de variante de producto
     * @param barcode - Código de barras del producto
     * @returns Promise con array de reglas de variante
     */
    async getProductVariantRules(barcode: string): Promise<Rule[]> {
        const rules = await this.getRulesByBarcode(barcode);
        return rules.product_variant;
    }

    /**
     * Calcula el precio más bajo disponible para un producto
     * @param barcode - Código de barras del producto
     * @param quantity - Cantidad para calcular precio (por defecto 1)
     * @returns Promise con el precio más bajo encontrado
     */
    async getBestPrice(barcode: string, quantity: number = 1): Promise<number> {
        const productData = await this.getProductByBarcodePost(barcode);
        const lst_price = productData.lst_price;

        const allRules = [
            ...productData.rules_by_application.product_variant,
            ...productData.rules_by_application.product_template,
            ...productData.rules_by_application.category,
            ...productData.rules_by_application.global
        ];

        const sorted = [...allRules].sort((a, b) => b.min_quantity - a.min_quantity);

        for (const rule of sorted) {
            if (quantity >= rule.min_quantity) {
                if (rule.fixed_price && rule.fixed_price > 0) {
                    return rule.fixed_price;
                }
                if (rule.percent_price && rule.compute_price === 'percentage') {
                    return lst_price * (1 - rule.percent_price / 100);
                }
            }
        }
        return lst_price;
    }

    /**
     * Obtiene información básica del producto sin reglas de precio
     * @param barcode - Código de barras del producto
     * @returns Promise con información básica del producto
     */
    async getBasicProductInfo(barcode: string): Promise<{
        name: string;
        barcode: string;
        basePrice: number;
    }> {
        const productData = await this.getProductByBarcodePost(barcode);
        return {
            name: productData.product_name,
            barcode: productData.barcode,
            basePrice: productData.lst_price
        };
    }
}

export const odooService = new OdooService();

export default OdooService;