import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { ApiService } from './services/api.service';
import { CartItem, Product, SaleOrder } from './models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
  encapsulation: ViewEncapsulation.None 
})
export class PosComponent implements OnInit, OnDestroy {
  selectedProductForStockUpdate: Product | null = null;
  showStockUpdatePopup = false;
  showAddProduct = false;

  products: Product[] = [];
  filteredProducts: Product[] = [];
  cart: CartItem[] = [];
  customerName = '';
  productSearch = '';
  cashPaid: number = 0;
  returnAmount: number = 0;
  pageSize = 8;
  currentPage = 1;
  isLoading = true;
  error: string | null = null;
  isCheckingOut = false;
  newProductName = '';
  newProductPrice: number | null = null;
  isAddingProduct = false;
  newProductStock: number | null = null;

  // New properties for price editing and discount
  editingPriceIndex: number | null = null;
  tempPrice: number = 0;
  discountAmount: number = 0;
  discountType: 'amount' | 'percentage' = 'amount';

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private sanitizer: DomSanitizer,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.productService.products$.subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products];
      },
      error: (err: any) => {
        console.error('Error in products subscription:', err);
        this.error = 'Error loading products. Please refresh the page.';
      }
    });
    window.addEventListener('toggle-add-product', this.toggleAddProductForm);
  }

  ngOnDestroy() {
    window.removeEventListener('toggle-add-product', this.toggleAddProductForm);
  }

  toggleAddProductForm = () => {
    this.showAddProduct = !this.showAddProduct;
  };

  private loadProducts(): void {
    this.isLoading = true;
    this.error = null;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.filteredProducts = [...products];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading products:', error);
        this.error = 'Failed to load products. Please try again.';
        this.isLoading = false;
      }
    });
  }

  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get pagedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  filterProducts(): void {
    const searchTerm = this.productSearch ? this.productSearch.toLowerCase().trim() : '';
    if (!searchTerm) {
      this.filteredProducts = [...this.products];
      return;
    }
    this.filteredProducts = this.products.filter(p => 
      p.name.toLowerCase().includes(searchTerm)
    );
  }

  onProductSearch() {
    this.filterProducts();
    this.currentPage = 1;
  }

  highlightSearch(name: string): SafeHtml {
    if (!this.productSearch || !this.productSearch.trim()) return name;
    
    const searchTerm = this.escapeRegExp(this.productSearch.trim());
    const re = new RegExp(`(${searchTerm})`, 'ig');
    const highlighted = name.replace(re, '<mark class="search-highlight">$1</mark>');
    
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  addToCart(product: Product): void {
    const existingItem = this.cart.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cart.push({
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }
    this.updateReturnAmount();
  }

  increment(i: number) {
    this.cart[i].quantity++;
    this.updateReturnAmount();
  }

  decrement(i: number) {
    if (this.cart[i].quantity > 1) {
      this.cart[i].quantity--;
    } else {
      this.remove(i);
    }
    this.updateReturnAmount();
  }

  remove(i: number) {
    this.cart.splice(i, 1);
    this.updateReturnAmount();
  }

  // New methods for price editing
  startEditingPrice(index: number) {
    this.editingPriceIndex = index;
    this.tempPrice = this.cart[index].price;
  }

  savePrice(index: number) {
    if (this.tempPrice > 0) {
      this.cart[index].price = this.tempPrice;
      this.updateReturnAmount();
    }
    this.editingPriceIndex = null;
  }

  cancelEditPrice() {
    this.editingPriceIndex = null;
    this.tempPrice = 0;
  }

  getSubtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getDiscountAmount(): number {
    const subtotal = this.getSubtotal();
    if (this.discountType === 'percentage') {
      return (subtotal * this.discountAmount) / 100;
    }
    return this.discountAmount;
  }

  getCartTotal(): number {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    return Math.max(0, subtotal - discount);
  }

  updateReturnAmount() {
    this.returnAmount = (this.cashPaid || 0) - this.getCartTotal();
  }

  resetDiscount() {
    this.discountAmount = 0;
    this.updateReturnAmount();
  }

  checkout(): void {
    if (this.cart.length === 0) return;
    if (this.cashPaid < this.getCartTotal()) {
      this.error = 'Insufficient payment. Please enter a valid amount.';
      return;
    }

    this.isCheckingOut = true;
    this.error = null;

    const order: SaleOrder = {
      id: 0, // Assuming backend assigns ID
      customerName: this.customerName || 'Walk-in Customer',
      items: this.cart.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      })),
      total: this.getCartTotal(),
      cashPaid: this.cashPaid,
      returnAmount: this.returnAmount,
      date: new Date()
    };

    this.orderService.createOrder(order).subscribe({
      next: (savedOrder) => {
        console.log('Order saved:', savedOrder);
        this.cart = [];
        this.customerName = '';
        this.cashPaid = 0;
        this.returnAmount = 0;
        this.discountAmount = 0;
        this.discountType = 'amount';
        this.isCheckingOut = false;
        this.loadProducts();
        alert('Order placed successfully!');
      },
      error: (error) => {
        console.error('Error saving order:', error);
        this.error = 'Failed to save order. Please try again.';
        this.isCheckingOut = false;
      }
    });
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  openStockMenu(product: Product) {
    this.selectedProductForStockUpdate = product;
    this.showStockUpdatePopup = true;
  }

  closeStockMenu() {
    this.selectedProductForStockUpdate = null;
    this.showStockUpdatePopup = false;
  }

  updateStock(newStock: number) {
    if (!this.selectedProductForStockUpdate) return;
    const updatedProduct: Product = {
      ...this.selectedProductForStockUpdate,
      stock: newStock
    };
    this.apiService.updateProductStock(updatedProduct.id!, updatedProduct).subscribe({
      next: (result: Product) => {
        this.selectedProductForStockUpdate!.stock = result.stock;
        this.showStockUpdatePopup = false;
      },
      error: (err: any) => {
        alert('Failed to update stock.');
      }
    });
  }

  addProductToList() {
    if (!this.newProductName.trim() || !this.newProductPrice || this.newProductPrice <= 0 || this.newProductStock == null || this.newProductStock < 0) return;

    this.isAddingProduct = true;
    const newProduct: Product = {
      id: 0, // Assuming backend assigns ID
      name: this.newProductName.trim(),
      price: this.newProductPrice,
      stock: this.newProductStock
    };

    this.productService.addProduct(newProduct).subscribe({
      next: () => {
        this.newProductName = '';
        this.newProductPrice = null;
        this.newProductStock = null;
        this.showAddProduct = false;
        this.isAddingProduct = false;
      },
      error: (error) => {
        console.error('Failed to add product', error);
        alert('Failed to add product. Please try again.');
        this.isAddingProduct = false;
      }
    });
  }
}