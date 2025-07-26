import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product, SaleOrder } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Product endpoints
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.apiUrl}/products`);
  }

  addProduct(product: { name: string; price: number }): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, product);
  }

  // Order endpoints
  getOrders(date?: string): Observable<SaleOrder[]> {
    const params = date ? { params: { date } } : {};
    return this.http.get<SaleOrder[]>(`${this.apiUrl}/sales`, params);
  }

  createOrder(order: Omit<SaleOrder, 'id' | 'date'>): Observable<SaleOrder> {
    return this.http.post<SaleOrder>(`${this.apiUrl}/sales`, order);
  }

  // Add more API methods as needed
}
