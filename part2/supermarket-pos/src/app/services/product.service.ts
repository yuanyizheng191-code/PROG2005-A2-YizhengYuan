import { Injectable } from '@angular/core';
import { Product, ProductCategory } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private products: Product[] = [];

    constructor() {
        this.loadSampleData();
    }

    private loadSampleData(): void {
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

    getAllProducts(): Product[] {
        return [...this.products];
    }

    getProductsByCategory(category: ProductCategory | 'all'): Product[] {
        if (category === 'all') return this.getAllProducts();
        return this.products.filter(p => p.category === category);
    }

    getProductByBarcode(barcode: string): Product | undefined {
        return this.products.find(p => p.barcode === barcode);
    }

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

    updateProduct(barcode: string, updatedData: Partial<Product>): { success: boolean; message: string } {
        const index = this.products.findIndex(p => p.barcode === barcode);
        if (index === -1) return { success: false, message: "Product not found!" };

        if (updatedData.barcode && updatedData.barcode !== barcode) {
            if (this.products.some(p => p.barcode === updatedData.barcode)) {
                return { success: false, message: `Barcode "${updatedData.barcode}" already exists!` };
            }
        }

        this.products[index] = { ...this.products[index], ...updatedData };
        return { success: true, message: "Product updated successfully!" };
    }

    deleteProduct(barcode: string): { success: boolean; message: string } {
        const index = this.products.findIndex(p => p.barcode === barcode);
        if (index === -1) return { success: false, message: "Product not found!" };

        const productName = this.products[index].name;
        this.products.splice(index, 1);
        return { success: true, message: `Product "${productName}" deleted successfully!` };
    }

    updateStock(barcode: string, newStock: number): boolean {
        const product = this.products.find(p => p.barcode === barcode);
        if (product && newStock >= 0) {
            product.stock = newStock;
            return true;
        }
        return false;
    }

    getLowStockProducts(): Product[] {
        return this.products.filter(p => p.stock < 10 && p.stock > 0);
    }

    getSpecialProducts(): Product[] {
        return this.products.filter(p => p.isSpecial);
    }

    getStats() {
        return {
            totalProducts: this.products.length,
            totalStock: this.products.reduce((sum, p) => sum + p.stock, 0),
            specialCount: this.products.filter(p => p.isSpecial).length,
            lowStockCount: this.getLowStockProducts().length,
            outOfStockCount: this.products.filter(p => p.stock === 0).length
        };
    }
}