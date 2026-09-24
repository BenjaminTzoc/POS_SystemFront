import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SaleOrdersComponent } from './sale-orders.component';
import { OrdersService } from '../services/orders.service';
import { SaleFoldersService } from '../services/sale-folders.service';
import { AuthService } from '../../auth/auth.service';
import { BranchesService } from '../../inventory/services/branches.service';
import { AreasService } from '../../logistics/services/areas.service';
import { SaleOrderWsService } from '../services/sale-order-ws.service';
import { SaleFolderDto } from '../interfaces/sale-folder.interface';
import { ISaleOrderResponse } from '../interfaces/sale-order.interface';
import { ApiResponse } from '../../core/models/api-response.model';

function ok<T>(data: T): ApiResponse<T> {
  return { statusCode: 200, message: 'ok', data, timestamp: '', path: '' };
}

const navidad: SaleFolderDto = {
  id: 'folder-1',
  name: 'Navidad 2026',
  color: '#c2410c',
  sortOrder: 0,
  branchId: 'branch-1',
  branchName: 'Planta Central',
  saleCount: 1,
  createdById: 'u1',
  createdAt: '2026-09-23T23:00:00.000Z',
};

const sale = { id: 'sale-1', invoiceNumber: 'F-10470' } as ISaleOrderResponse;

describe('SaleOrdersComponent carpetas', () => {
  let component: SaleOrdersComponent;
  let folders: jasmine.SpyObj<SaleFoldersService>;
  let orders: jasmine.SpyObj<OrdersService>;
  let messages: jasmine.SpyObj<MessageService>;
  let auth: { hasPermission: jasmine.Spy; currentUser: any };

  beforeEach(async () => {
    folders = jasmine.createSpyObj('SaleFoldersService', [
      'list', 'create', 'update', 'delete', 'addSales', 'removeSale', 'reorder',
    ]);
    orders = jasmine.createSpyObj('OrdersService', ['getSalesTable']);
    messages = jasmine.createSpyObj('MessageService', ['add']);
    auth = {
      hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true),
      currentUser: { roles: [{ isSuperAdmin: false }] },
    };

    folders.list.and.returnValue(of(ok([navidad])));
    orders.getSalesTable.and.returnValue(of(ok({ data: [sale], total: 1, page: 1, limit: 50, lastPage: 1 })));

    await TestBed.configureTestingModule({
      imports: [SaleOrdersComponent],
      providers: [
        { provide: SaleFoldersService, useValue: folders },
        { provide: OrdersService, useValue: orders },
        { provide: MessageService, useValue: messages },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: BranchesService, useValue: { getBranches: () => of(ok([])) } },
        { provide: AreasService, useValue: { getAreas: () => of(ok([])) } },
        { provide: SaleOrderWsService, useValue: { newSale$: new Subject() } },
      ],
    })
      .overrideComponent(SaleOrdersComponent, { set: { imports: [], template: '<div></div>', styleUrl: undefined } })
      .compileComponents();

    component = TestBed.createComponent(SaleOrdersComponent).componentInstance;
  });

  it('carga carpetas de la sucursal sin branchId si no es super admin', () => {
    component.ngOnInit();
    expect(folders.list).toHaveBeenCalledWith(null);
    expect(component.folders()).toEqual([navidad]);
  });

  it('al elegir carpeta pide table con folderId y sin fechas de 6 meses', () => {
    component.ngOnInit();
    orders.getSalesTable.calls.reset();

    component.selectFolder('folder-1');

    const filters = orders.getSalesTable.calls.mostRecent().args[0]!;
    expect(filters.folderId).toBe('folder-1');
    expect(filters.startDate).toBeUndefined();
    expect(filters.endDate).toBeUndefined();
  });

  it('Todas vuelve a enviar rango de fechas y no folderId', () => {
    component.selectFolder('folder-1');
    orders.getSalesTable.calls.reset();
    component.selectFolder(null);

    const filters = orders.getSalesTable.calls.mostRecent().args[0]!;
    expect(filters.folderId).toBeUndefined();
    expect(filters.startDate).toBeDefined();
    expect(filters.endDate).toBeDefined();
  });

  it('super admin abre el modal sin sucursal del encabezado', () => {
    auth.currentUser = { roles: [{ isSuperAdmin: true }] };
    const fresh = TestBed.createComponent(SaleOrdersComponent).componentInstance;
    fresh.selectedBranch.set('branch-header');
    fresh.openCreateFolder();
    expect(fresh.folderModalVisible()).toBeTrue();
    expect(fresh.folderBranchId()).toBeNull();
  });

  it('super admin no crea si no eligió sucursal en el modal', () => {
    auth.currentUser = { roles: [{ isSuperAdmin: true }] };
    const fresh = TestBed.createComponent(SaleOrdersComponent).componentInstance;
    fresh.folderName.set('Navidad 2026');
    fresh.saveFolder();
    expect(folders.create).not.toHaveBeenCalled();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
      summary: 'Sucursal',
    }));
  });

  it('super admin envía branchId del modal al crear', () => {
    auth.currentUser = { roles: [{ isSuperAdmin: true }] };
    folders.create.and.returnValue(of(ok(navidad)));
    const fresh = TestBed.createComponent(SaleOrdersComponent).componentInstance;
    fresh.selectedBranch.set('branch-header');
    fresh.folderBranchId.set('branch-1');
    fresh.folderName.set('Navidad 2026');
    fresh.folderColor.set('#c2410c');
    fresh.saveFolder();
    expect(folders.create).toHaveBeenCalledWith({
      name: 'Navidad 2026',
      color: '#c2410c',
      branchId: 'branch-1',
    });
  });

  it('usuario normal crea sin branchId', () => {
    folders.create.and.returnValue(of(ok(navidad)));
    component.folderName.set('Navidad 2026');
    component.folderColor.set('#c2410c');
    component.saveFolder();
    expect(folders.create).toHaveBeenCalledWith({
      name: 'Navidad 2026',
      color: '#c2410c',
      branchId: undefined,
    });
  });

  it('añade la orden a la carpeta con POST saleIds', () => {
    folders.addSales.and.returnValue(of(ok(navidad)));
    component.addToFolderOrder.set(sale);
    component.addOrderToFolder(navidad);
    expect(folders.addSales).toHaveBeenCalledWith('folder-1', { saleIds: ['sale-1'] });
  });

  it('quita la orden de la carpeta activa', () => {
    folders.removeSale.and.returnValue(of(ok(undefined)));
    component.selectedFolderId.set('folder-1');
    component.removeFromActiveFolder(sale);
    expect(folders.removeSale).toHaveBeenCalledWith('folder-1', 'sale-1');
  });

  it('muestra el error 400 de nombre duplicado', () => {
    folders.create.and.returnValue(throwError(() => ({ error: { message: 'Nombre duplicado en la sucursal' } })));
    component.folderName.set('Navidad 2026');
    component.saveFolder();
    expect(messages.add).toHaveBeenCalledWith(jasmine.objectContaining({
      severity: 'error',
      detail: 'Nombre duplicado en la sucursal',
    }));
  });

  it('reordena con offset de paginación', () => {
    folders.reorder.and.returnValue(of(ok(undefined)));
    component.selectedFolderId.set('folder-1');
    component.first.set(50);
    (component as any).allOrders.set([
      { id: 'sale-a' },
      { id: 'sale-b' },
    ]);

    const listRef = { id: 'orders-table-drop' };
    component.onOrdersListDrop({
      previousContainer: listRef,
      container: listRef,
      previousIndex: 0,
      currentIndex: 1,
    } as any);

    expect(folders.reorder).toHaveBeenCalledWith('folder-1', {
      items: [
        { saleId: 'sale-b', sortOrder: 50 },
        { saleId: 'sale-a', sortOrder: 51 },
      ],
    });
  });
});
