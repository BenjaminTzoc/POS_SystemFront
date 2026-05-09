import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from './menu-items';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../core/models/user.model';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { CashSession } from '../../inventory/interfaces/cash-register.interface';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ButtonModule, CommonModule, TooltipModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit, OnDestroy {
  private cashService = inject(CashRegisterService);
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();

  menuItems = computed(() => this.authService.mainMenuSignal());
  activeSubmenu: string | null = null;
  private userSubscription!: Subscription;
  currentUser = signal<User | null>(null);
  
  recurrentItems = computed(() => this.authService.recurrentMenuSignal());

  constructor(
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  currentCashSession = signal<CashSession | null>(null);

  ngOnInit(): void {
    this.checkCashStatus();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.keepParentOpenOnChildNavigation();
    });

    this.userSubscription = this.authService.user$.subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error desconocido al obtener datos del usuario',
        });
      },
    });
  }

  checkCashStatus() {
    this.cashService.getStatus().subscribe({
      next: (res) => this.currentCashSession.set(res.data),
    });
  }

  goToCash() {
    this.router.navigate(['/sales/cash-register']);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit(!this.sidebarCollapsed);
  }

  get recurrentMenu(): MenuItem[] {
    return this.recurrentItems();
  }

  get filteredMenuItems(): MenuItem[] {
    return this.menuItems();
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      if (this.activeSubmenu === item.label) {
        // Si ya está activo, lo cierra
        this.activeSubmenu = null;
      } else {
        // Abre el nuevo y cierra cualquier otro
        this.activeSubmenu = item.label;
      }
    }
  }

  isSubmenuOpen(item: MenuItem): boolean {
    return this.activeSubmenu === item.label;
  }

  isAnyChildActive(item: any): boolean {
    if (!item.children) return false;

    const currentUrl = this.router.url;
    return item.children.some((child: any) => child.route && currentUrl.startsWith(child.route));
  }

  private keepParentOpenOnChildNavigation(): void {
    const currentUrl = this.router.url;

    // Buscar en ambos menús
    const allMenus = [...this.menuItems(), ...this.recurrentItems()];

    // Buscar el padre que contiene la ruta actual en sus hijos
    const activeParent = allMenus.find(
      (item) =>
        item.children &&
        item.children.some((child: any) => child.route && currentUrl.startsWith(child.route)),
    );

    if (activeParent) {
      this.activeSubmenu = activeParent.label;
    } else {
      this.activeSubmenu = null;
    }
  }

  // Cerrar todos los submenus cuando se colapse el sidebar
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sidebarCollapsed'] && changes['sidebarCollapsed'].currentValue) {
      this.activeSubmenu = null;
    }
  }

  onRouteClick(): void {
    this.activeSubmenu = null;
  }

  confirmLogout(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Confirmar cierre de sesión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, salir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.performLogout();
      },
      reject: () => {
        // Opcional: Mensaje de cancelación
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Cierre de sesión cancelado',
          life: 2000,
        });
      },
    });
  }

  private performLogout(): void {
    this.authService.logout();

    this.messageService.add({
      severity: 'success',
      summary: 'Sesión cerrada',
      detail: 'Has salido de tu cuenta exitosamente',
      life: 3000,
    });
  }
}
