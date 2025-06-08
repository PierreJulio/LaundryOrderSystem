import { LaundryItem } from './laundry-item';

export enum OrderStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Completed = 3
}

export interface Order {
    id: number;
    orderDate: Date;
    laundryItems?: LaundryItem[];
    items?: LaundryItem[];        
    status: OrderStatus | string;
    userId: string;
    userName?: string;
    reason?: string;
    comment?: string;
    customerName?: string;
    customerSurname?: string;
}

export interface CreateOrderRequest {
    orderDate: Date;
    customerName: string;
    customerSurname: string;
    laundryItems: LaundryItem[];
    reason?: string;
    comment?: string;
}

export interface UpdateOrderStatusRequest {
    Status: OrderStatus;
    Reason?: string;
}
