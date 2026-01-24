import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { CashSession } from '../../inventory/interfaces/cash-register.interface';
import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';

import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cashService = inject(CashRegisterService);

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();

  currentCashSession = signal<CashSession | null>(null);

  ngOnInit() {
    this.checkCashStatus();
  }

  checkCashStatus() {
    this.cashService.getStatus().subscribe({
      next: (res) => this.currentCashSession.set(res.data),
    });
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
