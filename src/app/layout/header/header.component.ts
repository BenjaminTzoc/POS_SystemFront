import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

import { LowStockAlertsComponent } from '../../shared/notifications/low-stock-alerts/low-stock-alerts.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [LowStockAlertsComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();

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
