export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  children?: MenuItem[];
  badge?: number;
  badgeSeverity?: 'success' | 'info' | 'warning' | 'danger';
  permission?: string;
}

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
        permission: ''
      },
      {
        label: 'Productos',
        icon: 'pi pi-shopping-bag',
        route: '/inventory/products',
        permission: ''
      },
      {
        label: 'Categorías',
        icon: 'pi pi-tags',
        route: '/inventory/product-categories',
        permission: ''
      },
      {
        label: 'Traslados',
        icon: 'pi pi-arrows-h',
        route: 'inventory/transfers',
        permission: ''
      },
      {
        label: 'Unidades de medida',
        icon: 'pi pi-gauge',
        route: 'inventory/units',
        permission: ''
      }
    ]
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
      }
    ]
  }
]