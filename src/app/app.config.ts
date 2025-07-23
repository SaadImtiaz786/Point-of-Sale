import { Routes } from '@angular/router';
import { PosComponent } from './pos.component';
import { OrdersComponent } from './orders.component';

export const routes: Routes = [
  { path: '', component: PosComponent },
  { path: 'orders', component: OrdersComponent }
];
