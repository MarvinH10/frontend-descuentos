export interface PriceRule {
    min_quantity: number;
    price: number;
}

export interface Product {
    id: number;
    name: string;
    lst_price: number;
    product_tmpl_id: [number, string];
    categ_id: [number, string];
    finalPrice: number;
    appliedRule?: PriceRule;
    appliedQty: number;
    price_rules: PriceRule[];
}
