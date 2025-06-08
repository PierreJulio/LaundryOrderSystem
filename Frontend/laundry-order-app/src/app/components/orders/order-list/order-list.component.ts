import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { OrderService } from '../../../services/order.service';
import { Order, OrderStatus } from '../../../models/order';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    TableModule,
    ToastModule,
    TagModule,
    DialogModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  loading = true;
  selectedOrder: Order | null = null;
  detailsVisible = false;

  constructor(
    private orderService: OrderService, 
    private messageService: MessageService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }  loadOrders(): void {
    this.loading = true;
    
 
    this.orderService.getUserOrders().subscribe({
      next: (data) => {
        // Normaliser les données pour s'assurer que 'items' est toujours disponible
        this.orders = data.map(order => ({
          ...order,
          items: order.laundryItems || []  // Utiliser laundryItems comme source pour items
        }));
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les commandes'
        });
        this.loading = false;
      }
    });
      }

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
  getSeverity(status: OrderStatus | string): string {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return 'warning';
      case OrderStatus.Approved:
        return 'success';
      case OrderStatus.Rejected:
        return 'danger';
      case OrderStatus.Completed:
        return 'info';
      default:
        return 'secondary';
    }
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
  showDetails(order: Order): void {
    this.selectedOrder = order;
    this.detailsVisible = true;
    
    // Forcer la suppression du padding après l'ouverture
    setTimeout(() => {
      const dialogContent = document.querySelector('.modern-order-dialog .p-dialog-content');
      if (dialogContent) {
        (dialogContent as HTMLElement).style.padding = '0';
        (dialogContent as HTMLElement).style.margin = '0';
      }
    }, 0);
  }

  newOrder(): void {
    this.router.navigate(['/orders/new']);
  }  // Méthodes ajoutées pour la popup modernisée
  getStatusIcon(status: OrderStatus | string): string {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return 'pi pi-clock';
      case OrderStatus.Approved:
        return 'pi pi-check-circle';
      case OrderStatus.Rejected:
        return 'pi pi-times-circle';
      case OrderStatus.Completed:
        return 'pi pi-star';
      default:
        return 'pi pi-info-circle';
    }
  }

  getStatusColor(status: OrderStatus | string): string {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return '#f59e0b';
      case OrderStatus.Approved:
        return '#10b981';
      case OrderStatus.Rejected:
        return '#ef4444';
      case OrderStatus.Completed:
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  getStatusDescription(status: OrderStatus | string): string {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return 'Votre commande est en attente de validation';
      case OrderStatus.Approved:
        return 'Votre commande a été approuvée et va être traitée';
      case OrderStatus.Rejected:
        return 'Votre commande a été rejetée';
      case OrderStatus.Completed:
        return 'Votre commande a été complétée avec succès';
      default:
        return 'Statut non défini';
    }
  }

  getProgressPercentage(status: OrderStatus | string): number {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return 25;
      case OrderStatus.Approved:
        return 75;
      case OrderStatus.Rejected:
        return 0;
      case OrderStatus.Completed:
        return 100;
      default:
        return 0;
    }
  }

  printOrder(): void {
    // Fonction pour imprimer la commande
    window.print();
  }
}
