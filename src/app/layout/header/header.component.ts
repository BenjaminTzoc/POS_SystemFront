import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { MENU_ITEMS, MenuItem } from '../sidebar/menu-items';
import { Subscription, filter } from 'rxjs';

import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { CashSession } from '../../inventory/interfaces/cash-register.interface';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TooltipModule, ButtonModule, DrawerModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  animations: [
    trigger('submenuAnimation', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cashService = inject(CashRegisterService);

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();
  mobileMenuVisible = signal(false);
  menuItems: MenuItem[] = [...MENU_ITEMS];
  expandedItems: Set<string> = new Set();
  activeRoute = '';
  private routerSub?: Subscription;

  get currentCashSession() {
    return this.cashService.currentSession;
  }

  ngOnInit() {
    this.cashService.getStatus().subscribe();
    this.activeRoute = this.router.url;
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = (event as NavigationEnd).urlAfterRedirects;
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  toggleExpand(label: string) {
    if (this.expandedItems.has(label)) {
      this.expandedItems.delete(label);
    } else {
      this.expandedItems.clear(); // Cerrar los demás
      this.expandedItems.add(label);
    }
  }

  isExpanded(label: string): boolean {
    return this.expandedItems.has(label);
  }

  isActive(item: MenuItem): boolean {
    if (item.children && item.children.length > 0) {
      return item.children.some(child => this.isActive(child));
    }
    return !!item.route && item.route !== '' && this.activeRoute.startsWith(item.route);
  }

  get userInitials() {
    const name = this.currentUser?.name || 'User';
    return name.split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  closeMenu() {
    this.mobileMenuVisible.set(false);
  }

  goToCash() {
    this.router.navigate(['/sales/cash-register']);
  }

  userMenuItems = [
    {
      label: 'Perfil',
      icon: '',
      command: () => this.goToProfile(),
    },
    {
      label: 'Configuración',
      icon: 'pi pi-cog',
      command: () => this.goToSettings(),
    },
    {
      separator: true,
    },
    {
      label: 'Cerrar Sesión',
      icon: 'pi pi-sign-out',
      command: () => this.logout(),
    },
  ];

  get currentUser() {
    return this.authService.currentUser;
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit(!this.sidebarCollapsed);
  }

  goToProfile(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  goToSettings(): void {
    this.router.navigate(['/dashboard/settings']);
  }

  logout(): void {
    this.authService.logout();
  }
}
