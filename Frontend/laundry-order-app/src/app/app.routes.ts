import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { OrderFormComponent } from './components/orders/order-form/order-form.component';
import { OrderListComponent } from './components/orders/order-list/order-list.component';
import { OrderDetailComponent } from './components/orders/order-detail/order-detail.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { OrderValidationComponent } from './components/admin/order-validation/order-validation.component';
import { AuthGuardService as AuthGuard } from './services/guards/auth-guard.service';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'orders/new', component: OrderFormComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrderListComponent, canActivate: [AuthGuard] },
  { 
    path: 'orders/:id', 
    component: OrderDetailComponent, 
    canActivate: [AuthGuard],
    data: { prerender: false }
  },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
  { path: 'admin/validation', component: OrderValidationComponent, canActivate: [AuthGuard], data: { roles: ['Admin'] } },
  { path: '**', redirectTo: '/login' }
];
