import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from './services/order.service';
import { SaleOrder } from './models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: []
})
export class OrdersComponent implements OnInit {
  filterDate: string = '';
  orders: SaleOrder[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.loadOrders();
  }

  public loadOrders() {
    this.isLoading = true;
    this.error = null;
    
    this.orderService.loadOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.error = 'Failed to load orders. Please try again.';
        this.isLoading = false;
        this.orders = [];
      }
    });
  }

  get filteredSales(): SaleOrder[] {
    if (!this.filterDate) return this.orders;
    return this.orderService.getOrdersByDate(new Date(this.filterDate));
  }
}