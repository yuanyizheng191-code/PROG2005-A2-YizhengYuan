import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem, CouponType, PaymentMethod, Receipt } from '../models/product.model';
import { ProductService } from './product.service';
@Injectable({
    providedIn: 'root'
})
export class CartService {
    private cart: CartItem[] = [];
    private currentCoupon: CouponType = 'none';
    
    private cartSubject = new BehaviorSubject<CartItem[]>([]);
    cart$ = this.cartSubject.asObservable();
    
    private summarySubject = new BehaviorSubject<{
        totalItems: number;
        subtotal: number;
        discount: number;
        total: number;
    }>({ totalItems: 0, subtotal: 0, discount: 0, total: 0 });
    summary$ = this.summarySubject.asObservable();

    constructor(private productService: ProductService) {
        this.updateObservables();
    }

    private updateObservables(): void {
        this.cartSubject.next([...this.cart]);
        this.updateSummary();
    }

    private updateSummary(): void {
        const subtotal = this.calculateSubtotal();
        const discount = this.getDiscountAmount();
        const total = this.calculateTotal();
        const totalItems = this.getTotalItemsCount();

        this.summarySubject.next({ totalItems, subtotal, discount, total });
    }

    addToCart(barcode: string, quantity: number = 1): { success: boolean; message: string } {
        const product = this.productService.getProductByBarcode(barcode);
        if (!product) return { success: false, message: "Product not found!" };
        if (product.stock < quantity) return { success: false, message: `Insufficient stock! Available: ${product.stock}` };

        const existingItem = this.cart.find(item => item.product.barcode === barcode);
        if (existingItem) {
            if (existingItem.quantity + quantity > product.stock) {
                return { success: false, message: `Insufficient stock! Available: ${product.stock}` };
            }
            existingItem.quantity += quantity;
        } else {
            this.cart.push({ product: { ...product }, quantity });
        }

        this.updateObservables();
        return { success: true, message: `Added ${product.name} x${quantity}` };
    }

    updateQuantity(barcode: string, quantity: number): { success: boolean; message: string } {
        const item = this.cart.find(i => i.product.barcode === barcode);
        if (!item) return { success: false, message: "Product not in cart!" };
        
        if (quantity <= 0) return this.removeFromCart(barcode);
        
        if (quantity > item.product.stock) {
            return { success: false, message: `Insufficient stock! Available: ${item.product.stock}` };
        }

        item.quantity = quantity;
        this.updateObservables();
        return { success: true, message: "Quantity updated" };
    }

    removeFromCart(barcode: string): { success: boolean; message: string } {
        const index = this.cart.findIndex(i => i.product.barcode === barcode);
        if (index === -1) return { success: false, message: "Product not in cart!" };

        const itemName = this.cart[index].product.name;
        this.cart.splice(index, 1);
        this.updateObservables();
        return { success: true, message: `Removed ${itemName}` };
    }

    clearCart(): void {
        this.cart = [];
        this.currentCoupon = 'none';
        this.updateObservables();
    }

    getCart(): CartItem[] {
        return [...this.cart];
    }

    getTotalItemsCount(): number {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    calculateSubtotal(): number {
        return this.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    }

    private calculateCouponDiscount(coupon: CouponType, subtotal: number): number {
        switch (coupon) {
            case 'fixed10': return subtotal >= 100 ? 10 : 0;
            case 'fixed20': return subtotal >= 200 ? 20 : 0;
            case 'percent10': return subtotal * 0.1;
            default: return 0;
        }
    }

    getDiscountAmount(): number {
        const subtotal = this.calculateSubtotal();
        return this.calculateCouponDiscount(this.currentCoupon, subtotal);
    }

    calculateTotal(): number {
        const subtotal = this.calculateSubtotal();
        const discount = this.getDiscountAmount();
        return Math.max(0, subtotal - discount);
    }

    setCoupon(coupon: CouponType): void {
        this.currentCoupon = coupon;
        this.updateSummary();
    }

    checkout(paymentMethod: PaymentMethod): {
        success: boolean;
        message: string;
        receipt?: Receipt;
    } {
        if (this.cart.length === 0) {
            return { success: false, message: "Cart is empty!" };
        }

        for (const item of this.cart) {
            const product = this.productService.getProductByBarcode(item.product.barcode);
            if (product && product.stock < item.quantity) {
                return { success: false, message: `${product.name} insufficient stock! Available: ${product.stock}` };
            }
        }

        for (const item of this.cart) {
            const product = this.productService.getProductByBarcode(item.product.barcode);
            if (product) {
                this.productService.updateStock(item.product.barcode, product.stock - item.quantity);
            }
        }

        const subtotal = this.calculateSubtotal();
        const discount = this.getDiscountAmount();
        const total = this.calculateTotal();

        const paymentMethodName: Record<PaymentMethod, string> = {
            cash: "Cash", card: "Card", alipay: "Alipay", wechat: "WeChat Pay"
        };

        const receipt: Receipt = {
            items: [...this.cart],
            subtotal, discount, total,
            paymentMethod: paymentMethodName[paymentMethod],
            date: new Date(),
            orderId: `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`
        };

        this.cart = [];
        this.currentCoupon = 'none';
        this.updateObservables();

        return { success: true, message: "Checkout successful!", receipt };
    }
}