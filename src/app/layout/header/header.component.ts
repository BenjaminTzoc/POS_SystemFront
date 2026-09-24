import { Component, EventEmitter, inject, Input, Output, OnInit, OnDestroy, HostListener, signal, computed } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { MenuItem } from '../sidebar/menu-items';
import { Subscription, filter } from 'rxjs';
import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { DialogModule } from 'primeng/dialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { trigger, style, transition, animate } from '@angular/animations';
import { CashSessionDialogComponent } from '../../shared/components/cash-session-dialog/cash-session-dialog.component';

export interface CommandItem {
  label: string;
  category: string;
  icon: string;
  route: string;
  description?: string;
  badge?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    TooltipModule, 
    ButtonModule, 
    DrawerModule, 
    DialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    RouterModule, 
    CashSessionDialogComponent
  ],
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
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cashService = inject(CashRegisterService);

  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();
  
  // UI State Signals
  mobileMenuVisible = signal(false);
  showCashDialog = signal(false);
  searchModalVisible = signal(false);
  searchQuery = signal('');
  notificationsOpen = signal(false);
  userMenuOpen = signal(false);
  
  // Live Clock
  currentTime = signal(new Date());
  private clockInterval?: any;

  menuItems = computed(() => this.authService.mainMenuSignal());
  expandedItem: string | null = null;
  activeRoute = '';
  private routerSub?: Subscription;

  // Dynamic Command Palette Items generated from current authenticated menu
  commandList = computed<CommandItem[]>(() => {
    const items: CommandItem[] = [];
    const addedRoutes = new Set<string>();

    const main = this.authService.mainMenuSignal() || [];
    const recurrent = this.authService.recurrentMenuSignal() || [];

    const processItem = (item: MenuItem, categoryName?: string) => {
      if (item.children && item.children.length > 0) {
        item.children.forEach((child) => processItem(child, categoryName || item.label));
      } else if (item.route && item.route.trim() !== '') {
        if (!addedRoutes.has(item.route)) {
          addedRoutes.add(item.route);
          items.push({
            label: item.label,
            category: categoryName || 'General',
            icon: item.icon || 'pi pi-chevron-right',
            route: item.route,
            description: `Ir a ${item.label}`,
          });
        }
      }
    };

    main.forEach((item) => processItem(item));
    recurrent.forEach((item) => processItem(item, 'Accesos'));

    return items;
  });

  private normalizeText(text: string): string {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  filteredCommands = computed(() => {
    const rawQuery = this.searchQuery();
    const q = this.normalizeText(rawQuery);
    const list = this.commandList();
    if (!q) return list;

    return list.filter((item) => {
      const label = this.normalizeText(item.label);
      const category = this.normalizeText(item.category);
      const description = this.normalizeText(item.description || '');
      return label.includes(q) || category.includes(q) || description.includes(q);
    });
  });

  // Dynamic Breadcrumb based on active route
  currentSectionInfo = computed(() => {
    const url = this.activeRoute;
    if (url.startsWith('/sales/orders')) return { title: 'Órdenes de Venta', module: 'Ventas', icon: 'pi pi-shopping-cart' };
    if (url.startsWith('/sales/quick-sale') || url.startsWith('/sales/pos')) return { title: 'Punto de Venta (POS)', module: 'Ventas', icon: 'pi pi-bolt' };
    if (url.startsWith('/sales/quotations')) return { title: 'Cotizaciones', module: 'Ventas', icon: 'pi pi-file-edit' };
    if (url.startsWith('/sales/customers')) return { title: 'Clientes', module: 'Ventas', icon: 'pi pi-users' };
    if (url.startsWith('/sales/cash-history')) return { title: 'Historial de Cajas', module: 'Caja', icon: 'pi pi-history' };
    if (url.startsWith('/inventory/products')) return { title: 'Catálogo de Productos', module: 'Inventario', icon: 'pi pi-shopping-bag' };
    if (url.startsWith('/inventory/inventories')) return { title: 'Inventario de Stock', module: 'Inventario', icon: 'pi pi-box' };
    if (url.startsWith('/inventory/inventory-movements')) return { title: 'Movimientos de Stock', module: 'Inventario', icon: 'pi pi-arrows-alt' };
    if (url.startsWith('/inventory/inventory-transfers')) return { title: 'Traslados de Stock', module: 'Inventario', icon: 'pi pi-sync' };
    if (url.startsWith('/inventory/branches')) return { title: 'Sucursales', module: 'Configuración', icon: 'pi pi-building' };
    if (url.startsWith('/purchases')) return { title: 'Compras & Proveedores', module: 'Compras', icon: 'pi pi-truck' };
    if (url.startsWith('/dashboard/profile')) return { title: 'Mi Perfil', module: 'Usuario', icon: 'pi pi-user' };
    if (url.startsWith('/dashboard/settings')) return { title: 'Configuración del Sistema', module: 'Ajustes', icon: 'pi pi-cog' };
    return { title: 'Panel de Control', module: 'Dashboard', icon: 'pi pi-home' };
  });

  // Notifications
  notifications = [
    { id: 1, title: 'Caja Principal', text: 'Turno de caja activo y sincronizado', time: 'En vivo', icon: 'pi pi-wallet', type: 'success' },
    { id: 2, title: 'Órdenes de Hoy', text: 'Tienes órdenes pendientes de despacho', time: 'Hace 10 min', icon: 'pi pi-shopping-cart', type: 'info' },
    { id: 3, title: 'Sistema POS', text: 'Conexión en línea y segura', time: 'Hoy', icon: 'pi pi-check-circle', type: 'success' },
  ];

  get currentCashSession() {
    return this.cashService.currentSession;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  get userInitials() {
    const name = this.currentUser?.name || 'User';
    return name.split(' ')
      .filter((n) => n.length > 0)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  ngOnInit() {
    this.cashService.getStatus().subscribe();
    this.activeRoute = this.router.url;
    this.autoExpandActiveRoute();
    
    // Live Clock Interval
    this.clockInterval = setInterval(() => {
      this.currentTime.set(new Date());
    }, 1000);

    this.routerSub = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = (event as NavigationEnd).urlAfterRedirects;
      this.autoExpandActiveRoute();
      this.notificationsOpen.set(false);
      this.userMenuOpen.set(false);
    });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  // Keyboard shortcut Ctrl+K / Cmd+K
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSpotlight();
    }
  }

  // Spotlight Actions
  openSpotlight() {
    this.searchQuery.set('');
    this.searchModalVisible.set(true);
  }

  closeSpotlight() {
    this.searchModalVisible.set(false);
  }

  executeCommand(route: string) {
    this.searchModalVisible.set(false);
    this.router.navigate([route]);
  }

  autoExpandActiveRoute() {
    for (const item of this.menuItems()) {
      if (item.children && item.children.some((child) => child.route && this.activeRoute.startsWith(child.route))) {
        this.expandedItem = item.label;
        break;
      }
    }
  }

  toggleExpand(label: string) {
    if (this.expandedItem === label) {
      this.expandedItem = null;
    } else {
      this.expandedItem = label;
    }
  }

  isExpanded(label: string): boolean {
    return this.expandedItem === label;
  }

  isActive(item: MenuItem): boolean {
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => this.isActive(child));
    }
    return !!item.route && item.route !== '' && this.activeRoute.startsWith(item.route);
  }

  closeMenu() {
    this.mobileMenuVisible.set(false);
  }

  goToCash() {
    this.showCashDialog.set(true);
  }

  goToPos() {
    this.router.navigate(['/sales/quick-sale']);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit(!this.sidebarCollapsed);
  }

  goToProfile(): void {
    this.userMenuOpen.set(false);
    this.router.navigate(['/dashboard/profile']);
  }

  goToSettings(): void {
    this.userMenuOpen.set(false);
    this.router.navigate(['/dashboard/settings']);
  }

  logout(): void {
    this.userMenuOpen.set(false);
    this.authService.logout();
  }

  toggleNotifications(event?: Event) {
    if (event) event.stopPropagation();
    this.userMenuOpen.set(false);
    this.notificationsOpen.set(!this.notificationsOpen());
  }

  toggleUserMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.notificationsOpen.set(false);
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.notificationsOpen.set(false);
    this.userMenuOpen.set(false);
  }
}
