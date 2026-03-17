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
import { MENU_ITEMS, MenuItem, RECURRENT_MENU } from './menu-items';
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

  menuItems = MENU_ITEMS;
  activeSubmenu: string | null = null;
  private userSubscription!: Subscription;
  currentUser = signal<User | null>(null);
  recurrentItems = computed(() => {
    const user = this.currentUser();
    return this.filterMenuItemsByPermission(RECURRENT_MENU, user);
  });

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

  private filterMenuItemsByPermission(items: MenuItem[], user: User | null): MenuItem[] {
    if (!user) return [];

    return items
      .map((item) => {
        // Si el item tiene hijos, filtrar también los hijos
        if (item.children) {
          const filteredChildren = this.filterMenuItemsByPermission(item.children, user);

          // Si después de filtrar no hay hijos y el item principal no tiene ruta propia,
          // ocultar el item principal también
          if (filteredChildren.length === 0 && !item.route) {
            return null;
          }

          return {
            ...item,
            children: filteredChildren,
          };
        }

        // Si el item no tiene permiso requerido, mostrarlo siempre
        if (!item.permission) {
          return item;
        }

        // Verificar si el usuario tiene el permiso requerido
        const hasPermission = this.authService.hasPermission(item.permission);

        return hasPermission ? item : null;
      })
      .filter((item): item is MenuItem => item !== null);
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
    return this.menuItems;
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
    const allMenus = [...this.menuItems, ...RECURRENT_MENU];

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
