import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TimelineModule } from 'primeng/timeline';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { Order, OrderStatus } from '../../../models/order';

interface TimelineEvent {
  status: string;
  date: Date;
  icon: string;
  color: string;
  description?: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    ToastModule,
    TagModule,
    TimelineModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss'
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  events: TimelineEvent[] = [];
  returnUrl = '/orders'; // URL par défaut

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private authService: AuthService,
    private messageService: MessageService
  ) { }
  ngOnInit(): void {
    // Déterminer l'URL de retour en fonction de l'origine
    this.determineReturnUrl();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadOrder(+id);
      }
    });
  }

  private determineReturnUrl(): void {
    // Vérifier s'il y a une URL de retour sauvegardée
    const savedReturnUrl = sessionStorage.getItem('orderDetailReturnUrl');
    if (savedReturnUrl) {
      this.returnUrl = savedReturnUrl;
      // Nettoyer après utilisation
      sessionStorage.removeItem('orderDetailReturnUrl');
      return;
    }

    // Si l'utilisateur est admin et vient potentiellement du dashboard
    if (this.authService.isAdmin()) {
      // Vérifier l'historique de navigation
      const currentUrl = this.router.url;
      const referrer = document.referrer;
      
      // Si on ne trouve pas d'origine spécifique, utiliser le dashboard admin par défaut pour les admins
      if (referrer.includes('/admin') || 
          sessionStorage.getItem('lastAdminPage') === '/admin') {
        this.returnUrl = '/admin';
      } else {
        this.returnUrl = '/orders';
      }
    } else {
      this.returnUrl = '/orders';
    }
  }

  goBack(): void {
    // Utiliser l'URL de retour déterminée
    this.router.navigate([this.returnUrl]);
  }
  loadOrder(id: number): void {
    this.loading = true;
    this.orderService.getOrderById(id).subscribe({
      next: (data) => {
        // S'assurer que la propriété items est toujours disponible
        this.order = {
          ...data,
          items: data.laundryItems || data.items || []
        };
        this.generateTimelineEvents();
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les détails de la commande'
        });
        this.loading = false;
        // Navigate back to the orders list after a short delay
        setTimeout(() => this.router.navigate(['/orders']), 2000);
      }
    });
  }
  generateTimelineEvents(): void {
    if (!this.order) return;

    // Add order creation event
    this.events.push({
      status: 'Commande créée',
      date: this.order.orderDate,
      icon: 'pi pi-shopping-cart',
      color: '#3F51B5'
    });

    // Add status change events based on current status
    const statusValue = this.getStatusValue(this.order.status);
    
    switch (statusValue) {
      case OrderStatus.Approved:
        this.events.push({
          status: 'Commande approuvée',
          date: new Date(), // We don't have actual approval date in model
          icon: 'pi pi-check-circle',
          color: '#4CAF50',
          description: this.order.comment || 'Votre commande a été approuvée.'
        });
        break;
      case OrderStatus.Rejected:
        this.events.push({
          status: 'Commande rejetée',
          date: new Date(), // We don't have actual rejection date in model
          icon: 'pi pi-times-circle',
          color: '#F44336',
          description: this.order.comment || 'Votre commande a été rejetée.'
        });
        break;
      case OrderStatus.Completed:
        this.events.push({
          status: 'Commande approuvée',
          date: new Date(), // Simulate a date
          icon: 'pi pi-check-circle',
          color: '#4CAF50'
        });
        this.events.push({
          status: 'Commande terminée',
          date: new Date(), // We don't have actual completion date in model
          icon: 'pi pi-flag-fill',
          color: '#009688'
        });
        break;
    }
  }// Helper pour convertir le statut en valeur enum numérique
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
  }  getSeverity(status: OrderStatus | string): string {
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
        return 'info';
    }
  }  getStatusIcon(status: OrderStatus | string): string {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return 'pi pi-clock';
      case OrderStatus.Approved:
        return 'pi pi-check-circle';
      case OrderStatus.Rejected:
        return 'pi pi-times-circle';
      case OrderStatus.Completed:
        return 'pi pi-flag-fill';
      default:
        return 'pi pi-info-circle';
    }
  }  getStatusColor(status: OrderStatus | string): string {
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
  }  getStatusDescription(status: OrderStatus | string): string {
    const statusValue = this.getStatusValue(status);
    
    switch (statusValue) {
      case OrderStatus.Pending:
        return 'Votre commande est en cours de traitement';
      case OrderStatus.Approved:
        return 'Votre commande a été approuvée et sera traitée prochainement';
      case OrderStatus.Rejected:
        return 'Votre commande a été rejetée';
      case OrderStatus.Completed:
        return 'Votre commande a été traitée et terminée';
      default:
        return 'Statut de la commande';
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
        return 100;
      case OrderStatus.Completed:
        return 100;
      default:
        return 0;
    }
  }

  printOrder(): void {
    window.print();
  }
}
