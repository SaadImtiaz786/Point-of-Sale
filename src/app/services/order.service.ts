import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { OrderItem, SaleOrder } from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orders = new BehaviorSubject<SaleOrder[]>([]);
  orders$ = this.orders.asObservable();

  constructor(private apiService: ApiService) {
    this.loadOrders();
  }

  loadOrders(): Observable<SaleOrder[]> {
    return this.apiService.getOrders().pipe(
      tap(orders => {
        const parsedOrders = orders.map(order => ({
          ...order,
          date: new Date(order.date)
        }));
        this.orders.next(parsedOrders);
      }),
      catchError(error => {
        console.error('Failed to load orders', error);
        this.orders.next([]);
        return of([]);
      })
    );
  }

  createOrder(orderData: Omit<SaleOrder, 'id' | 'date'>): Observable<SaleOrder> {
    // Ensure date is set to current date
    const orderWithDate = {
      ...orderData,
      date: new Date()
    };
    
    return this.apiService.createOrder(orderWithDate).pipe(
      tap((newOrder) => {
        const currentOrders = this.orders.value;
        this.orders.next([...currentOrders, newOrder]);
      })
    );
  }

  getOrdersByDate(date: Date): SaleOrder[] {
    if (!date) return this.orders.value;
    
    const targetDate = new Date(date);
    return this.orders.value.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.toDateString() === targetDate.toDateString();
    });
  }

  // Get orders as observable
  getOrders(): Observable<SaleOrder[]> {
    return this.orders$;
  }

  // Refresh orders from the server
  refreshOrders(): void {
    this.loadOrders();
  }
}
