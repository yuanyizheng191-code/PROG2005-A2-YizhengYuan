export enum ProductCategory {
    Food = "Food & Beverage",
    Fresh = "Fresh Produce",
    Daily = "Daily Supplies",
    Home = "Home Goods"
}

export interface Product {
    barcode: string;
    name: string;
    category: ProductCategory;
    price: number;
    stock: number;
    isSpecial: boolean;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface Receipt {
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    date: Date;
    orderId: string;
}

export type CouponType = 'none' | 'fixed10' | 'fixed20' | 'percent10';
export type PaymentMethod = 'cash' | 'card' | 'alipay' | 'wechat';