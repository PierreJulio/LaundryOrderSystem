import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';

import { OrderService } from '../../../services/order.service';
import { Order, OrderStatus, UpdateOrderStatusRequest } from '../../../models/order';

@Component({
  selector: 'app-order-validation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    TagModule,
    DialogModule,
    InputTextarea,
    DropdownModule
  ],
  providers: [MessageService],
  templateUrl: './order-validation.component.html',
  styleUrl: './order-validation.component.scss'
})
export class OrderValidationComponent implements OnInit {
  pendingOrders: Order[] = [];
  loading = true;
  selectedOrder: Order | null = null;
  validationVisible = false;
  validationForm: FormGroup;  statusOptions = [
    { label: 'Approuvée', value: OrderStatus.Approved },
    { label: 'Rejetée', value: OrderStatus.Rejected }
  ];
  constructor(
    private orderService: OrderService,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.validationForm = this.fb.group({
      status: [OrderStatus.Approved, Validators.required],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.loadPendingOrders();
  }
  loadPendingOrders(): void {
    this.loading = true;
    this.orderService.getPendingOrders().subscribe({
      next: (data) => {
        // Normaliser les données pour s'assurer que 'items' est toujours disponible
        this.pendingOrders = data.map(order => ({
          ...order,
          items: order.laundryItems || order.items || []
        }));
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les commandes en attente'
        });
        this.loading = false;
      }
    });
  }
  showValidationDialog(order: Order): void {
    this.selectedOrder = order;
    this.validationForm.reset({
      status: OrderStatus.Approved,
      reason: ''
    });
    this.validationVisible = true;
  }  validateOrder(): void {
    if (!this.selectedOrder || !this.validationForm.valid) {
      return;
    }

    const updateRequest: UpdateOrderStatusRequest = {
      Status: this.validationForm.value.status,
      Reason: this.validationForm.value.reason
    };

    this.orderService.updateOrderStatus(this.selectedOrder.id, updateRequest).subscribe({      next: () => {
        const statusText = updateRequest.Status === OrderStatus.Approved ? 'approuvée' : 'rejetée';
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `La commande a été ${statusText}`
        });
        this.validationVisible = false;
        this.loadPendingOrders(); // Reload the list
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: `Erreur lors de la mise à jour du statut de la commande: ${error.message}`
        });
      }
    });  }
  
  // Helper pour convertir le statut en valeur enum numérique
  private getStatusValue(status: OrderStatus | string): OrderStatus {
    if (typeof status === 'string') {
      switch (status.toLowerCase()) {
        case 'pending': return OrderStatus.Pending;
        case 'approved': return OrderStatus.Approved;
        case 'rejected': return OrderStatus.Rejected;
        case 'completed': return OrderStatus.Completed;
        default: return OrderStatus.Pending;
      }
    }
    return status as OrderStatus;
  }

  getStatusLabel(status: OrderStatus | string): string {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return 'En attente';
      case OrderStatus.Approved:
        return 'Approuvée';
      case OrderStatus.Rejected:
        return 'Rejetée';
      case OrderStatus.Completed:
        return 'Terminée';
      default:
        return 'Statut inconnu';
    }
  }
}
