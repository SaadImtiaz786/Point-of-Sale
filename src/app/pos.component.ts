import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, NgStyle, CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { CartItem, Product, SaleOrder } from './models';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './pos.component.html',
})
export class PosComponent implements OnInit, OnDestroy {
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

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    private sanitizer: DomSanitizer
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
    const searchTerm = this.productSearch.toLowerCase().trim();
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
    if (!this.productSearch) return name;
    const re = new RegExp(`(${this.escapeRegExp(this.productSearch)})`, 'ig');
    const highlighted = name.replace(re, '<span class="highlight">$1</span>');
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  addToCart(product: Product): void {
    const existingItem = this.cart.find(item => item.productId === product.id);
    if (existingItem) {
      existingItem.quantity++;
      existingItem.qty++;
    } else {
      this.cart.push({
        productId: product.id!,
        name: product.name,
        price: product.price,
        quantity: 1,
        qty: 1
      });
    }
    this.calculateTotal();
  }

  increment(i: number) {
    this.cart[i].qty++;
    this.updateReturnAmount();
  }

  decrement(i: number) {
    if (this.cart[i].qty > 1) this.cart[i].qty--;
    else this.remove(i);
    this.updateReturnAmount();
  }

  remove(i: number) {
    this.cart.splice(i, 1);
    this.updateReturnAmount();
  }

  calculateTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  updateReturnAmount() {
    this.returnAmount = (this.cashPaid || 0) - this.getCartTotal();
  }

  checkout(): void {
    if (this.cart.length === 0) return;
    if (this.cashPaid < this.getCartTotal()) {
      this.error = 'Insufficient payment. Please enter a valid amount.';
      return;
    }

    this.isCheckingOut = true;
    this.error = null;
    
    const order = {
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
        this.isCheckingOut = false;
        // Show success message
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

  showAddProduct = false;
  newProductName = '';
  newProductPrice: number | null = null;
  isAddingProduct = false;

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }
  
  addProductToList() {
    if (!this.newProductName.trim() || !this.newProductPrice || this.newProductPrice <= 0) return;
    
    this.isAddingProduct = true;
    const newProduct = { 
      name: this.newProductName.trim(), 
      price: this.newProductPrice 
    };

    this.productService.addProduct(newProduct).subscribe({
      next: () => {
        this.newProductName = '';
        this.newProductPrice = null;
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