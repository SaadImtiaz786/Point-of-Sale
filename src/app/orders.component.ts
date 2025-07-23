import { Component } from '@angular/core';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosComponent } from './pos.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [NgIf, NgFor, DatePipe, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: []
})
export class OrdersComponent {
  filterDate: string = '';

  get sales() {
    return PosComponent.sales;
  }

  get filteredSales() {
    if (!this.filterDate) return this.sales;
    return this.sales.filter(order => {
      const localDate = new Date(order.date);
      const yyyy = localDate.getFullYear();
      const mm = String(localDate.getMonth() + 1).padStart(2, '0');
      const dd = String(localDate.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;
      return formatted === this.filterDate;
    });
  }
}