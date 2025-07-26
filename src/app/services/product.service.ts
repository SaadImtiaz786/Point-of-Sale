import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { Product } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products = new BehaviorSubject<Product[]>([]);
  products$ = this.products.asObservable();

  constructor(private apiService: ApiService) {
    // Initial load
    this.getProducts().subscribe();
  }

  // Get products from the API
  getProducts(): Observable<Product[]> {
    return this.apiService.getProducts().pipe(
      tap(products => this.products.next(products)),
      catchError(error => {
        console.error('Failed to load products', error);
        return throwError(() => new Error('Failed to load products'));
      })
    );
  }

  // Add a new product
  addProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.apiService.addProduct(product).pipe(
      tap(newProduct => {
        const currentProducts = this.products.value;
        this.products.next([...currentProducts, newProduct]);
      })
    );
  }

  searchProducts(term: string): Product[] {
    if (!term) return this.products.value;
    const searchTerm = term.toLowerCase();
    return this.products.value.filter(p => 
      p.name.toLowerCase().includes(searchTerm)
    );
  }

  // Helper method to get product by ID
  getProductById(id: number): Product | undefined {
    return this.products.value.find(p => p.id === id);
  }

  // Refresh products from the server
  refreshProducts(): void {
    this.getProducts().subscribe();
  }
}
