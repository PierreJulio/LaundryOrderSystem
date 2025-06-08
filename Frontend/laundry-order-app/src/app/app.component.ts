import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

import { AuthService } from './services/auth.service';
import { User } from './models/user';

@Component({
  selector: 'app-root',
  standalone: true,  imports: [
    RouterOutlet,
    CommonModule,
    MenubarModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'laundry-order-app';
  items: MenuItem[] = [];
  currentUser: User | null = null;
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.updateMenu();
    });
  }
  updateMenu() {
    this.items = [];

    if (this.currentUser) {
      // Menu Accueil
      this.items.push({
        label: 'Accueil',
        icon: 'pi pi-home',
        routerLink: ['/']
      });

      // Menu Commandes avec sous-menus
      this.items.push({
        label: 'Commandes',
        icon: 'pi pi-shopping-cart',
        items: [
          {
            label: 'Nouvelle commande',
            icon: 'pi pi-plus-circle',
            routerLink: ['/orders/new']
          },
          {
            label: 'Mes commandes',
            icon: 'pi pi-list',
            routerLink: ['/orders']
          }
        ]
      });

      // Menu Administration (admin uniquement)
      if (this.authService.isAdmin()) {
        this.items.push({
          label: 'Administration',
          icon: 'pi pi-cog',
          items: [
            {
              label: 'Tableau de bord',
              icon: 'pi pi-chart-line',
              routerLink: ['/admin']
            },
            {
              label: 'Validation',
              icon: 'pi pi-check-circle',
              routerLink: ['/admin/validation']
            }
          ]
        });
      }
    }
  }

  logout() {
    this.authService.logout();
  }
}
