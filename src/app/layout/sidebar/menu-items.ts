export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
  badge?: number;
  badgeSeverity?: 'success' | 'info' | 'warning' | 'danger';
  permission?: string;
  visible?: boolean;
}

export const RECURRENT_MENU: MenuItem[] = [
  {
    label: 'Inicio',
    icon: 'pi pi-home',
    route: '/dashboard',
    permission: '',
  },
  {
    label: 'Productos',
    icon: 'pi pi-shopping-bag',
    route: '/inventory/products',
    permission: 'products.manage',
  },
  {
    label: 'Inventario',
    icon: 'pi pi-box',
    route: '/inventory/inventories',
    permission: '',
  },
  {
    label: 'Clientes',
    icon: 'pi pi-users',
    route: '/sales/customers',
    permission: '',
  },
  {
    label: 'Ventas',
    icon: 'pi pi-shopping-cart',
    route: '/sales/orders',
    permission: '',
  },
  {
    label: 'Historial de Cajas',
    icon: 'pi pi-history',
    route: '/sales/cash-history',
    permission: '',
  },
  {
    label: 'POS Rápido',
    icon: 'pi pi-desktop',
    route: '/sales/pos',
    permission: '',
  },
  {
    label: 'Movimientos de inventario',
    icon: 'pi pi-objects-column',
    route: '/inventory/inventory-movements',
    permission: '',
  },
  {
    label: 'Traslados de Inventario',
    icon: 'pi pi-sync',
    route: '/inventory/inventory-transfers',
    permission: '',
  },
  {
    label: 'Órdenes de Compra',
    icon: 'pi pi-shopping-bag',
    route: '/purchases/orders',
    permission: '',
  },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Inicio',
    icon: 'pi pi-home',
    route: '/dashboard',
    permission: '',
  },
  {
    label: 'Inventario',
    icon: 'pi pi-box',
    route: '/inventory',
    permission: '',
    children: [
      {
        label: 'Inventario principal',
        icon: 'pi pi-box',
        route: '/inventory/inventories',
        permission: '',
      },
      {
        label: 'Productos',
        icon: 'pi pi-shopping-bag',
        route: '/inventory/products',
        permission: '',
      },
      {
        label: 'Traslados',
        icon: 'pi pi-sync',
        route: '/inventory/inventory-transfers',
        permission: '',
      }
    ],
  },
  {
    label: 'Ventas',
    icon: 'pi pi-shopping-cart',
    route: '/sales',
    permission: '',
    children: [
      {
        label: 'Clientes',
        icon: '',
        route: '/sales/customers',
        permission: '',
      },
      {
        label: 'Órdenes de Venta',
        icon: '',
        route: '/sales/orders',
        permission: '',
      },
      {
        label: 'Historial de Cajas',
        icon: 'pi pi-history',
        route: '/sales/cash-history',
        permission: '',
      },
      {
        label: 'Cotizaciones',
        icon: 'pi pi-file-edit',
        route: '/sales/quotations',
        permission: '',
      },
    ],
  },
  {
    label: 'Producción',
    icon: 'pi pi-microchip-ai',
    route: '/production',
    permission: '',
    children: [
      {
        label: 'Despiece (Cortes)',
        icon: 'pi pi-percentage',
        route: '/production/decomposition',
        permission: '',
      },
      {
        label: 'Manufactura',
        icon: 'pi pi-hammer',
        route: '/production/orders',
        permission: '',
      },
      {
        label: 'Recetas',
        icon: 'pi pi-receipt',
        route: '/production/recipes',
        permission: '',
      }
    ]
  },
  {
    label: 'Logística',
    icon: 'pi pi-truck',
    route: '/logistics',
    permission: '',
    children: [
      {
        label: 'Despachos de Ruta',
        icon: 'pi pi-send',
        route: '/logistics/dispatches',
        permission: '',
      },
      {
        label: 'Liquidación Diaria',
        icon: 'pi pi-calculator',
        route: '/logistics/settlements',
        permission: '',
      },
      {
        label: 'Devoluciones',
        icon: 'pi pi-backward',
        route: '/logistics/returns',
        permission: '',
      }
    ]
  },
  {
    label: 'Compras',
    icon: 'pi pi-shopping-bag',
    route: '/purchases',
    permission: '',
    children: [
      {
        label: 'Ordenes de compra',
        icon: 'pi pi-shopping-cart',
        route: '/purchases/orders',
        permission: '',
      },
    ],
  },
  {
    label: 'Catálogos',
    icon: 'pi pi-list',
    route: '/catalogs',
    permission: '',
    children: [
      {
        label: 'Sucursales',
        icon: 'pi pi-map-marker',
        route: '/inventory/branches',
        permission: '',
      },
      {
        label: 'Unidades de medida',
        icon: 'pi pi-gauge',
        route: '/inventory/units',
        permission: '',
      },
      {
        label: 'Categorías',
        icon: 'pi pi-tags',
        route: '/inventory/product-categories',
        permission: '',
      },
      {
        label: 'Proveedores',
        icon: 'pi pi-truck',
        route: '/purchases/suppliers',
        permission: '',
      },
      {
        label: 'Áreas de Preparación',
        icon: 'pi pi-map',
        route: '/logistics/areas',
        permission: '',
      }
    ]
  }
];
