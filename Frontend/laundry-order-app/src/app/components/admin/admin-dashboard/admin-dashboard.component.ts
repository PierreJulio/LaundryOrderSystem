import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { OrderService } from '../../../services/order.service';
import { Order, OrderStatus } from '../../../models/order';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  encapsulation: ViewEncapsulation.None,  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    CardModule,
    ChartModule,
    TableModule,
    ToastModule,
    TabViewModule,
    TagModule,
    ToggleButtonModule,
    TooltipModule
  ],
  providers: [MessageService],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  // Exposer l'enum pour l'utiliser dans le template
  OrderStatus = OrderStatus;
  
  orders: Order[] = [];
  pendingOrders: Order[] = [];
  loading = true;
  
  // Chart data
  statusChartData: any;
  statusChartOptions: any;  // Statistics
  totalOrders = 0;
  pendingCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  completedCount = 0;
  
  // Filter state
  statusFilter: OrderStatus | null = null;

  constructor(
    private orderService: OrderService,
    private messageService: MessageService,
    private router: Router
  ) { }  ngOnInit(): void {
    console.log('AdminDashboard ngOnInit called');
    
    this.configureCharts();
    
    // Initialiser avec des valeurs de test et garder ces valeurs si le backend échoue
    this.totalOrders = 10;
    this.pendingCount = 3;
    this.approvedCount = 4;
    this.rejectedCount = 2;
    this.completedCount = 1;
    this.updateChartData();
    
    // Essayer de charger les vraies données, mais garder les valeurs de test en cas d'échec
    this.loadOrders();
  }  loadOrders(): void {
    console.log('Loading orders...');
    this.loading = true;
    
    // Load all orders first
    this.orderService.getOrders().subscribe({
      next: (data) => {
        console.log('Raw orders data received:', data);
        this.orders = data || []; // S'assurer que orders n'est jamais null/undefined
        console.log('Orders assigned:', this.orders.length);
        
        // Ne calculer les statistiques que si on a vraiment des données
        if (this.orders.length > 0) {
          this.calculateStatistics();
          this.updateChartData();
        } else {
          console.log('No orders received, using demo data');
          // Utiliser les données de démo si aucune donnée n'est reçue
        }
        
        this.loading = false;
        
        // Essayer de charger les statistiques du backend, mais seulement si on a des données
        if (this.orders.length > 0) {
          this.loadStatistics();
        }
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.loading = false;
        // Utiliser les données de démo en cas d'erreur
        this.messageService.add({
          severity: 'info',
          summary: 'Mode démonstration',
          detail: 'Utilisation des données de démonstration'
        });
      }
    });

    // Load pending orders (optional, not critical)
    this.loadPendingOrders();
  }
  private loadStatistics(): void {
    this.orderService.getOrderStats().subscribe({
      next: (stats) => {
        console.log('Statistics loaded from backend:', stats);
        
        // Vérifier que les statistiques du backend sont valides avant de les utiliser
        if (stats && typeof stats.Total === 'number' && stats.Total >= 0) {
          this.totalOrders = stats.Total;
          this.pendingCount = stats.Pending || 0;
          this.approvedCount = stats.Approved || 0;
          this.rejectedCount = stats.Rejected || 0;
          this.completedCount = stats.Completed || 0;
          this.updateChartData();
          console.log('Backend statistics applied successfully');
        } else {
          console.log('Backend statistics invalid, keeping current values');
        }
      },
      error: (error) => {
        console.error('Error loading statistics from backend:', error);
        // Garder les statistiques actuelles (locales ou de test)
        this.messageService.add({
          severity: 'info',
          summary: 'Information',
          detail: 'Utilisation des statistiques locales'
        });
      }
    });
  }

  private loadPendingOrders(): void {
    this.orderService.getPendingOrders().subscribe({
      next: (data) => {
        this.pendingOrders = data;
        console.log('Pending orders loaded:', data.length);
      },
      error: (error) => {
        console.error('Error loading pending orders:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les commandes en attente'
        });
      }
    });
  }  calculateStatistics(): void {
    console.log('Calculating statistics...');
    console.log('Orders for calculation:', this.orders);
    
    if (!this.orders || this.orders.length === 0) {
      console.log('No orders to calculate statistics from, keeping current values');
      return;
    }
    
    this.totalOrders = this.orders.length;
    console.log('Total orders:', this.totalOrders);
    
    // Utiliser notre fonction helper pour normaliser les statuts
    this.pendingCount = this.orders.filter(o => this.getStatusValue(o.status) === OrderStatus.Pending).length;
    this.approvedCount = this.orders.filter(o => this.getStatusValue(o.status) === OrderStatus.Approved).length;
    this.rejectedCount = this.orders.filter(o => this.getStatusValue(o.status) === OrderStatus.Rejected).length;
    this.completedCount = this.orders.filter(o => this.getStatusValue(o.status) === OrderStatus.Completed).length;
    
    console.log('Statistics calculated:');
    console.log('Total:', this.totalOrders);
    console.log('Pending:', this.pendingCount);
    console.log('Approved:', this.approvedCount);
    console.log('Rejected:', this.rejectedCount);
    console.log('Completed:', this.completedCount);
    
    // Debug: let's see what status values we actually have
    console.log('Order statuses in data:', this.orders.map(o => ({ id: o.id, status: o.status, statusType: typeof o.status })));
  }configureCharts(): void {
    this.statusChartOptions = {
      plugins: {
        legend: {
          labels: {
            color: 'var(--text-color)',
            font: {
              size: 12
            }
          },
          position: 'bottom'
        },
        tooltip: {
          backgroundColor: 'var(--surface-card)',
          titleColor: 'var(--text-color)',
          bodyColor: 'var(--text-color)',
          borderColor: 'var(--surface-border)',
          borderWidth: 1
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };
  }  updateChartData(): void {
    this.statusChartData = {
      labels: ['En attente', 'Approuvées', 'Rejetées', 'Terminées'],
      datasets: [
        {
          data: [this.pendingCount, this.approvedCount, this.rejectedCount, this.completedCount],
          backgroundColor: [
            '#f59e0b', // Jaune pour En attente
            '#10b981', // Vert pour Approuvées  
            '#ef4444', // Rouge pour Rejetées
            '#3b82f6'  // Bleu pour Terminées
          ],
          hoverBackgroundColor: [
            '#d97706',
            '#059669',
            '#dc2626',
            '#2563eb'
          ],
          borderWidth: 2,
          borderColor: 'var(--surface-border)'
        }
      ]
    };  }

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
  }    // Filtre les commandes par statut sélectionné ou retourne toutes les commandes si aucun filtre n'est appliqué
  getFilteredOrders(): Order[] {
    if (this.statusFilter === null) {
      return this.orders;
    }
    
    const filtered = this.orders.filter(order => {
      const orderStatusValue = this.getStatusValue(order.status);
      return orderStatusValue === this.statusFilter;
    });
    
    console.log(`Filtering for status ${this.statusFilter} (${this.getStatusLabel(this.statusFilter)}):`, filtered.length, 'orders found');
    return filtered;
  }
  
  // Définit le filtre de statut
  setStatusFilter(status: OrderStatus | null): void {
    this.statusFilter = status;
  }    // Retourne la sévérité du tag PrimeNG en fonction du statut de la commande
  getStatusClass(status: OrderStatus | string): string {
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

  // Navigation vers les détails d'une commande en sauvegardant l'origine
  viewOrderDetails(orderId: number): void {
    // Sauvegarder que l'utilisateur vient du dashboard admin
    sessionStorage.setItem('orderDetailReturnUrl', '/admin');
    sessionStorage.setItem('lastAdminPage', '/admin');
    
    // Naviguer vers les détails de la commande
    this.router.navigate(['/orders', orderId]);
  }
}
