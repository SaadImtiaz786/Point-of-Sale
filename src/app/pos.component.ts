import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, DatePipe, NgStyle } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface Product {
  name: string;
  price: number;
}
interface CartItem extends Product {
  qty: number;
}
interface SaleOrder {
  id: number;
  customerName: string;
  items: CartItem[];
  total: number;
  cashPaid: number;
  returnAmount: number;
  date: Date;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, NgIf, NgFor],
  templateUrl: './pos.component.html',
})
export class PosComponent implements OnInit, OnDestroy {
  customerName = '';
  productSearch = '';
  cart: CartItem[] = [];
  cashPaid: number = 0;
  returnAmount: number = 0;

  products: Product[] = [
    { name: 'Shirt', price: 1200 },
    { name: 'Jeans', price: 2200 },
    { name: 'Sneakers', price: 3500 },
    { name: 'Handbag', price: 1800 },
    { name: 'Wrist Watch', price: 4500 },
    { name: 'Perfume', price: 2100 },
    { name: 'Sunglasses', price: 900 },
    { name: 'Trousers', price: 1600 },
    { name: 'T-Shirt', price: 800 },
    { name: 'Jacket', price: 3200 },
    { name: 'Sandals', price: 1100 },
    { name: 'Cap', price: 400 },
    { name: 'Socks', price: 200 },
    { name: 'Belt', price: 600 },
    { name: 'Wallet', price: 750 },
    { name: 'Backpack', price: 1700 },
    { name: 'Dress', price: 2500 },
    { name: 'Scarf', price: 350 },
    { name: 'Tie', price: 300 },
    { name: 'Blazer', price: 2800 },
    { name: 'Formal Shoes', price: 2700 },
    { name: 'Sports Shoes', price: 3200 },
    { name: 'Kurta', price: 1300 },
    { name: 'Dupatta', price: 500 },
    { name: 'Earrings', price: 650 },
    { name: 'Necklace', price: 1200 },
    { name: 'Ring', price: 900 },
    { name: 'Makeup Kit', price: 2100 },
    { name: 'Hair Dryer', price: 1800 },
    { name: 'Towel', price: 350 },
    { name: 'Bedsheet', price: 1400 },
    { name: 'Pillow', price: 700 },
    { name: 'Blanket', price: 2200 },
    { name: 'Cookware Set', price: 3200 },
    { name: 'Dinner Set', price: 2500 },
    { name: 'Water Bottle', price: 350 },
    { name: 'Lunch Box', price: 600 },
    { name: 'Notebook', price: 120 },
    { name: 'Pen', price: 50 },
    { name: 'Back Cover', price: 300 }
  ];

  filteredProducts: Product[] = [...this.products];
  pageSize = 8;
  currentPage = 1;

  // Sales storage (simulate backend)
  static sales: SaleOrder[] = [];
  static orderIdCounter = 1;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    window.addEventListener('toggle-add-product', this.toggleAddProductForm);
  }
  ngOnDestroy() {
    window.removeEventListener('toggle-add-product', this.toggleAddProductForm);
  }
  toggleAddProductForm = () => {
    this.showAddProduct = !this.showAddProduct;
  };

  get totalPages() {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get pagedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  onProductSearch() {
    const term = this.productSearch.trim().toLowerCase();
    this.filteredProducts = term
      ? this.products.filter(p => p.name.toLowerCase().includes(term))
      : [...this.products];
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

  addProduct(prod: Product) {
    const existing = this.cart.find(c => c.name === prod.name);
    if (existing) {
      existing.qty++;
    } else {
      this.cart.push({ ...prod, qty: 1 });
    }
    this.updateReturnAmount();
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

  getTotal() {
    return this.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  updateReturnAmount() {
    this.returnAmount = (this.cashPaid || 0) - this.getTotal();
  }

  checkout() {
    if (this.returnAmount < 0) {
      alert('Insufficient cash paid!');
      return;
    }
    PosComponent.sales.push({
      id: PosComponent.orderIdCounter++,
      customerName: this.customerName,
      items: this.cart.map(item => ({ ...item })),
      total: this.getTotal(),
      cashPaid: this.cashPaid,
      returnAmount: this.returnAmount,
      date: new Date()
    });
    alert(
      `Checkout successful!\nCustomer: ${this.customerName || 'N/A'}\nTotal: Rs ${this.getTotal()}\nCash Paid: Rs ${this.cashPaid}\nReturn: Rs ${this.returnAmount}\nItems: ${this.cart.length}`
    );
    this.cart = [];
    this.customerName = '';
    this.cashPaid = 0;
    this.returnAmount = 0;
    this.updateReturnAmount();
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

  addProductToList() {
    if (!this.newProductName.trim() || !this.newProductPrice || this.newProductPrice <= 0) return;
    this.products.push({ name: this.newProductName.trim(), price: this.newProductPrice });
    this.filteredProducts = [...this.products];
    this.newProductName = '';
    this.newProductPrice = null;
    this.showAddProduct = false;
  }
}