// ==================== Type Definitions ====================

enum ProductCategory {
    Food = "Food & Beverage",
    Fresh = "Fresh Produce",
    Daily = "Daily Supplies",
    Home = "Home Goods"
}

type CouponType = 'none' | 'fixed10' | 'fixed20' | 'percent10';
type PaymentMethod = 'cash' | 'card' | 'alipay' | 'wechat';

interface Product {
    barcode: string;
    name: string;
    category: ProductCategory;
    price: number;
    stock: number;
    isSpecial: boolean;
}

interface CartItem {
    product: Product;
    quantity: number;
}

interface Receipt {
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    date: Date;
    orderId: string;
}

// ==================== Supermarket POS Class ====================

class SupermarketPOS {
    private products: Product[] = [];
    private cart: CartItem[] = [];
    private currentCoupon: CouponType = 'none';
    
    addProduct(product: Product): { success: boolean; message: string } {
        if (this.products.some(p => p.barcode === product.barcode)) {
            return { success: false, message: `Barcode "${product.barcode}" already exists!` };
        }
        if (!product.barcode.trim()) return { success: false, message: "Barcode cannot be empty!" };
        if (!product.name.trim()) return { success: false, message: "Product name cannot be empty!" };
        if (product.price <= 0) return { success: false, message: "Price must be greater than 0!" };
        if (product.stock < 0) return { success: false, message: "Stock cannot be negative!" };
        
        this.products.push({ ...product });
        return { success: true, message: `Product "${product.name}" added successfully!` };
    }
    
    getAllProducts(): Product[] {
        return [...this.products];
    }
    
    getProductsByCategory(category: ProductCategory | 'all'): Product[] {
        if (category === 'all') return this.getAllProducts();
        return this.products.filter(p => p.category === category);
    }
    
    getSpecialProducts(): Product[] {
        return this.products.filter(p => p.isSpecial);
    }
    
    getProductByBarcode(barcode: string): Product | undefined {
        return this.products.find(p => p.barcode === barcode);
    }
    
    updateStock(barcode: string, newStock: number): boolean {
        const product = this.products.find(p => p.barcode === barcode);
        if (product && newStock >= 0) {
            product.stock = newStock;
            return true;
        }
        return false;
    }
    
    addToCart(barcode: string, quantity: number = 1): { success: boolean; message: string } {
        const product = this.products.find(p => p.barcode === barcode);
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
        return { success: true, message: `Added ${product.name} x${quantity}` };
    }
    
    updateCartItemQuantity(barcode: string, quantity: number): { success: boolean; message: string } {
        const item = this.cart.find(i => i.product.barcode === barcode);
        if (!item) return { success: false, message: "Product not in cart!" };
        if (quantity <= 0) return this.removeFromCart(barcode);
        if (quantity > item.product.stock) return { success: false, message: `Insufficient stock! Available: ${item.product.stock}` };
        
        item.quantity = quantity;
        return { success: true, message: "Quantity updated" };
    }
    
    removeFromCart(barcode: string): { success: boolean; message: string } {
        const index = this.cart.findIndex(i => i.product.barcode === barcode);
        if (index === -1) return { success: false, message: "Product not in cart!" };
        
        const itemName = this.cart[index].product.name;
        this.cart.splice(index, 1);
        return { success: true, message: `Removed ${itemName}` };
    }
    
    clearCart(): void {
        this.cart = [];
        this.currentCoupon = 'none';
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
    }
    
    getCurrentCoupon(): CouponType {
        return this.currentCoupon;
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
            const product = this.products.find(p => p.barcode === item.product.barcode);
            if (product) {
                if (product.stock < item.quantity) {
                    return { success: false, message: `${product.name} insufficient stock! Available: ${product.stock}` };
                }
                product.stock -= item.quantity;
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
        
        return { success: true, message: "Checkout successful!", receipt };
    }
    
    getLowStockProducts(): Product[] {
        return this.products.filter(p => p.stock < 10 && p.stock > 0);
    }
    
    getOutOfStockProducts(): Product[] {
        return this.products.filter(p => p.stock === 0);
    }
    
    getStats() {
        return {
            totalProducts: this.products.length,
            totalStock: this.products.reduce((sum, p) => sum + p.stock, 0),
            specialCount: this.products.filter(p => p.isSpecial).length,
            lowStockCount: this.getLowStockProducts().length,
            outOfStockCount: this.getOutOfStockProducts().length
        };
    }
    
    loadSampleData(): void {
        const sampleProducts: Product[] = [
            { barcode: "690123456789", name: "Mineral Water", category: ProductCategory.Food, price: 2.00, stock: 50, isSpecial: true },
            { barcode: "690123456788", name: "Coca Cola", category: ProductCategory.Food, price: 3.50, stock: 100, isSpecial: false },
            { barcode: "690123456787", name: "Instant Noodles", category: ProductCategory.Food, price: 5.00, stock: 80, isSpecial: true },
            { barcode: "690123456786", name: "Red Fuji Apple", category: ProductCategory.Fresh, price: 8.90, stock: 30, isSpecial: false },
            { barcode: "690123456785", name: "Imported Banana", category: ProductCategory.Fresh, price: 5.50, stock: 25, isSpecial: false },
            { barcode: "690123456784", name: "Shampoo", category: ProductCategory.Daily, price: 35.00, stock: 20, isSpecial: false },
            { barcode: "690123456783", name: "Laundry Detergent", category: ProductCategory.Daily, price: 28.00, stock: 15, isSpecial: true },
            { barcode: "690123456782", name: "Plastic Wrap", category: ProductCategory.Home, price: 12.00, stock: 40, isSpecial: false },
            { barcode: "690123456781", name: "Facial Tissue", category: ProductCategory.Daily, price: 15.00, stock: 5, isSpecial: true },
            { barcode: "690123456780", name: "Milk", category: ProductCategory.Food, price: 6.50, stock: 0, isSpecial: false }
        ];
        
        sampleProducts.forEach(product => {
            this.addProduct(product);
        });
    }
}

// ==================== UI Handler Class ====================

class POSUI {
    private pos: SupermarketPOS;
    private currentCategory: ProductCategory | 'all' = 'all';
    
    constructor(pos: SupermarketPOS) {
        this.pos = pos;
        this.pos.loadSampleData();
        this.initEventListeners();
        this.updateDate();
        this.renderProducts();
        this.renderCart();
        this.updateSummary();
        this.updateStats();
    }
    
    private updateDate(): void {
        const dateElem = document.getElementById('current-date');
        if (dateElem) {
            const now = new Date();
            dateElem.textContent = now.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                weekday: 'short'
            });
        }
    }
    
    private showToast(message: string, isError: boolean = false): void {
        const toast = document.getElementById('toast-message');
        if (toast) {
            toast.textContent = message;
            toast.style.background = isError ? '#dc2626' : '#1f2937';
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
    }
    
    private updateStats(): void {
        const stats = this.pos.getStats();
        const productsElem = document.getElementById('stat-products');
        const specialElem = document.getElementById('stat-special');
        const lowstockElem = document.getElementById('stat-lowstock');
        
        if (productsElem) productsElem.textContent = stats.totalProducts.toString();
        if (specialElem) specialElem.textContent = stats.specialCount.toString();
        if (lowstockElem) lowstockElem.textContent = stats.lowStockCount.toString();
    }
    
    private renderProducts(): void {
        const grid = document.getElementById('product-grid');
        if (!grid) return;
        
        const products = this.pos.getProductsByCategory(this.currentCategory);
        
        if (products.length === 0) {
            grid.innerHTML = '<div class="loading">No products found</div>';
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="product-card ${product.isSpecial ? 'special' : ''}" data-barcode="${product.barcode}">
                ${product.isSpecial ? '<div class="special-badge">⭐ Special</div>' : ''}
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-price">$${product.price.toFixed(2)}<small>/ea</small></div>
                <div class="product-stock ${product.stock === 0 ? 'stock-out' : product.stock < 10 ? 'stock-warning' : ''}">
                    📦 Stock: ${product.stock}
                </div>
            </div>
        `).join('');
        
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const barcode = card.getAttribute('data-barcode');
                if (barcode) {
                    const result = this.pos.addToCart(barcode, 1);
                    this.showToast(result.message, !result.success);
                    if (result.success) {
                        this.renderCart();
                        this.updateSummary();
                        this.updateStats();
                    }
                }
            });
        });
    }
    
    private renderCart(): void {
        const cartContainer = document.getElementById('cart-list');
        if (!cartContainer) return;
        
        const cart = this.pos.getCart();
        
        if (cart.length === 0) {
            cartContainer.innerHTML = '<div class="empty-cart">🛒 Cart is empty<br>Click on products to add</div>';
            return;
        }
        
        cartContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-barcode="${item.product.barcode}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${this.escapeHtml(item.product.name)}</div>
                    <div class="cart-item-price">$${item.product.price.toFixed(2)} / ea</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn dec">-</button>
                    <span class="quantity-num">${item.quantity}</span>
                    <button class="quantity-btn inc">+</button>
                    <span class="cart-item-total">$${(item.product.price * item.quantity).toFixed(2)}</span>
                    <span class="remove-item">🗑️</span>
                </div>
            </div>
        `).join('');
        
        cartContainer.querySelectorAll('.cart-item').forEach(itemElem => {
            const barcode = itemElem.getAttribute('data-barcode');
            if (!barcode) return;
            
            const decBtn = itemElem.querySelector('.dec');
            const incBtn = itemElem.querySelector('.inc');
            const removeBtn = itemElem.querySelector('.remove-item');
            
            if (decBtn) {
                decBtn.addEventListener('click', () => {
                    const currentItem = this.pos.getCart().find(i => i.product.barcode === barcode);
                    if (currentItem) {
                        const newQty = currentItem.quantity - 1;
                        const result = this.pos.updateCartItemQuantity(barcode, newQty);
                        this.showToast(result.message, !result.success);
                        this.renderCart();
                        this.updateSummary();
                    }
                });
            }
            
            if (incBtn) {
                incBtn.addEventListener('click', () => {
                    const currentItem = this.pos.getCart().find(i => i.product.barcode === barcode);
                    if (currentItem) {
                        const newQty = currentItem.quantity + 1;
                        const result = this.pos.updateCartItemQuantity(barcode, newQty);
                        this.showToast(result.message, !result.success);
                        this.renderCart();
                        this.updateSummary();
                    }
                });
            }
            
            if (removeBtn) {
                removeBtn.addEventListener('click', () => {
                    const result = this.pos.removeFromCart(barcode);
                    this.showToast(result.message, !result.success);
                    this.renderCart();
                    this.updateSummary();
                    this.updateStats();
                });
            }
        });
    }
    
    private updateSummary(): void {
        const subtotal = this.pos.calculateSubtotal();
        const discount = this.pos.getDiscountAmount();
        const total = this.pos.calculateTotal();
        const totalItems = this.pos.getTotalItemsCount();
        
        const subtotalElem = document.getElementById('subtotal');
        const discountElem = document.getElementById('discount');
        const totalElem = document.getElementById('total-amount');
        const itemsElem = document.getElementById('total-items');
        
        if (subtotalElem) subtotalElem.textContent = `$${subtotal.toFixed(2)}`;
        if (discountElem) discountElem.textContent = `-$${discount.toFixed(2)}`;
        if (totalElem) totalElem.textContent = `$${total.toFixed(2)}`;
        if (itemsElem) itemsElem.textContent = totalItems.toString();
    }
    
    private initEventListeners(): void {
        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const category = target.dataset.category as ProductCategory | 'all';
                this.currentCategory = category;
                
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                target.classList.add('active');
                
                this.renderProducts();
            });
        });
        
        // Clear cart
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => {
                if (confirm('Clear entire cart?')) {
                    this.pos.clearCart();
                    this.renderCart();
                    this.updateSummary();
                    this.showToast('Cart cleared');
                }
            });
        }
        
        // Apply coupon
        const applyCouponBtn = document.getElementById('apply-coupon');
        const couponSelect = document.getElementById('coupon-select') as HTMLSelectElement;
        if (applyCouponBtn && couponSelect) {
            applyCouponBtn.addEventListener('click', () => {
                const coupon = couponSelect.value as CouponType;
                this.pos.setCoupon(coupon);
                this.updateSummary();
                const discount = this.pos.getDiscountAmount();
                if (discount > 0) {
                    this.showToast(`Coupon applied! Saved $${discount.toFixed(2)}`);
                } else {
                    this.showToast(`Minimum spend not met for this coupon`, true);
                }
            });
        }
        
        // Checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const selectedPayment = document.querySelector('input[name="payment"]:checked') as HTMLInputElement;
                const paymentMethod = selectedPayment?.value as PaymentMethod || 'cash';
                
                const result = this.pos.checkout(paymentMethod);
                if (result.success && result.receipt) {
                    this.showReceipt(result.receipt);
                    this.renderCart();
                    this.updateSummary();
                    this.updateStats();
                    this.renderProducts();
                } else {
                    this.showToast(result.message, true);
                }
            });
        }
        
        // Add product modal
        const showModalBtn = document.getElementById('show-add-product');
        const modal = document.getElementById('product-modal');
        const closeModal = document.querySelector('#product-modal .close');
        
        if (showModalBtn && modal) {
            showModalBtn.addEventListener('click', () => {
                modal.style.display = 'flex';
            });
            
            if (closeModal) {
                closeModal.addEventListener('click', () => {
                    modal.style.display = 'none';
                });
            }
            
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Add product form
        const addForm = document.getElementById('add-product-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddProduct();
            });
        }
        
        // Receipt modal close
        const receiptModal = document.getElementById('receipt-modal');
        const closeReceipt = document.querySelector('#receipt-modal .close-receipt');
        
        if (closeReceipt && receiptModal) {
            closeReceipt.addEventListener('click', () => {
                receiptModal.style.display = 'none';
            });
            
            window.addEventListener('click', (e) => {
                if (e.target === receiptModal) {
                    receiptModal.style.display = 'none';
                }
            });
        }
        
        // Print receipt
        const printBtn = document.getElementById('print-receipt');
        if (printBtn) {
            printBtn.addEventListener('click', () => {
                window.print();
            });
        }
    }
    
    private handleAddProduct(): void {
        const barcodeInput = document.getElementById('prod-barcode') as HTMLInputElement;
        const nameInput = document.getElementById('prod-name') as HTMLInputElement;
        const categorySelect = document.getElementById('prod-category') as HTMLSelectElement;
        const priceInput = document.getElementById('prod-price') as HTMLInputElement;
        const stockInput = document.getElementById('prod-stock') as HTMLInputElement;
        const specialSelect = document.getElementById('prod-special') as HTMLSelectElement;
        
        const product: Product = {
            barcode: barcodeInput.value.trim(),
            name: nameInput.value.trim(),
            category: categorySelect.value as ProductCategory,
            price: parseFloat(priceInput.value) || 0,
            stock: parseInt(stockInput.value) || 0,
            isSpecial: specialSelect.value === 'true'
        };
        
        const result = this.pos.addProduct(product);
        this.showToast(result.message, !result.success);
        
        if (result.success) {
            barcodeInput.value = '';
            nameInput.value = '';
            priceInput.value = '';
            stockInput.value = '100';
            specialSelect.value = 'false';
            
            const modal = document.getElementById('product-modal');
            if (modal) modal.style.display = 'none';
            
            this.renderProducts();
            this.updateStats();
        }
    }
    
    private showReceipt(receipt: Receipt): void {
        const receiptContainer = document.getElementById('receipt-content');
        if (!receiptContainer) return;
        
        const itemsHtml = receipt.items.map(item => `
            <div class="receipt-item">
                <span>${this.escapeHtml(item.product.name)} x${item.quantity}</span>
                <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
        `).join('');
        
        receiptContainer.innerHTML = `
            <div class="receipt-header">
                <h4>EasyMart Supermarket</h4>
                <p>${receipt.date.toLocaleString()}</p>
                <p>Order: ${receipt.orderId}</p>
            </div>
            <div class="receipt-divider"></div>
            ${itemsHtml}
            <div class="receipt-divider"></div>
            <div class="receipt-item">
                <span>Subtotal:</span>
                <span>$${receipt.subtotal.toFixed(2)}</span>
            </div>
            <div class="receipt-item">
                <span>Discount:</span>
                <span> -$${receipt.discount.toFixed(2)}</span>
            </div>
            <div class="receipt-total">
                <div class="receipt-item">
                    <span>TOTAL:</span>
                    <span>$${receipt.total.toFixed(2)}</span>
                </div>
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-item">
                <span>Payment:</span>
                <span>${receipt.paymentMethod}</span>
            </div>
            <div class="receipt-footer">
                <p>Thank you for shopping at EasyMart!</p>
                <p>Have a great day! 🛒</p>
            </div>
        `;
        
        const modal = document.getElementById('receipt-modal');
        if (modal) modal.style.display = 'flex';
    }
    
    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// ==================== Initialize Application ====================

document.addEventListener('DOMContentLoaded', () => {
    const pos = new SupermarketPOS();
    const ui = new POSUI(pos);
    console.log('POS System initialized');
});