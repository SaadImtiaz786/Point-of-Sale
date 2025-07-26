import { Routes } from '@angular/router';
import { PosComponent } from './pos.component';
import { OrdersComponent } from './orders.component';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { ApiService } from './services/api.service';

export const routes: Routes = [
  { path: '', component: PosComponent },
  { path: 'orders', component: OrdersComponent }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    ApiService
  ]
};
