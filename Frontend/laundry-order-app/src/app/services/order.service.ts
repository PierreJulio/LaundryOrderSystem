import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order, OrderStatus, UpdateOrderStatusRequest } from '../models/order';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'http://localhost:5085/api/orders';

  constructor(private http: HttpClient) { }

  // Get all orders
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.apiUrl);
  }

  // Get order by ID
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  // Create a new order
  createOrder(order: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }
  // Update order status
  updateOrderStatus(id: number, statusRequest: UpdateOrderStatusRequest): Observable<Order> {
    console.log('Sending status update request:', JSON.stringify(statusRequest));
    return this.http.put<Order>(`${this.apiUrl}/${id}/status`, statusRequest);
  }

  // Get pending orders (for admin)
  getPendingOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/pending`);
  }
    // Get orders by user
  getUserOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}`);
  }

  // Get orders by status
  getOrdersByStatus(status: OrderStatus): Observable<Order[]> {
    return this.getOrders().pipe(
      map(orders => orders.filter(order => order.status === status))
    );
  }

  // Get completed orders
  getCompletedOrders(): Observable<Order[]> {
    return this.getOrdersByStatus(OrderStatus.Completed);
  }

  // Get order statistics
  getOrderStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
