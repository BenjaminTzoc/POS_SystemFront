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
    label: 'Sucursales',
    icon: 'pi pi-map-marker',
    route: '/inventory/branches',
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
        label: 'Categorías',
        icon: 'pi pi-tags',
        route: '/inventory/product-categories',
        permission: '',
      },
      {
        label: 'Traslados',
        icon: 'pi pi-arrows-h',
        route: '/inventory/transfers',
        permission: '',
      },
      {
        label: 'Unidades de medida',
        icon: 'pi pi-gauge',
        route: '/inventory/units',
        permission: '',
      },
      {
        label: 'Sucursales',
        icon: 'pi pi-map-marker',
        route: '/inventory/branches',
        permission: '',
      },
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
    ],
  },
  {
    label: 'Compras',
    icon: 'pi pi-shopping-bag',
    route: '/purchases',
    permission: '',
    children: [
      {
        label: 'Proveedores',
        icon: 'pi pi-truck',
        route: '/purchases/suppliers',
        permission: '',
      },
      {
        label: 'Ordenes de compra',
        icon: 'pi pi-shopping-cart',
        route: '/purchases/orders',
        permission: '',
      },
    ],
  },
];
