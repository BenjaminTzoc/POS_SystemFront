import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { SaleFoldersService } from './sale-folders.service';
import { SaleFolderDto } from '../interfaces/sale-folder.interface';
import { ApiResponse } from '../../core/models/api-response.model';

const API = `${environment.apiUrl}/sale-folders`;

function ok<T>(data: T): ApiResponse<T> {
  return { statusCode: 200, message: 'ok', data, timestamp: '', path: '' };
}

const folder: SaleFolderDto = {
  id: 'folder-1',
  name: 'Navidad 2026',
  color: '#c2410c',
  sortOrder: 0,
  branchId: 'branch-1',
  branchName: 'Planta Central',
  saleCount: 2,
  createdById: 'user-1',
  createdAt: '2026-09-23T23:00:00.000Z',
};

describe('SaleFoldersService', () => {
  let service: SaleFoldersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), SaleFoldersService],
    });
    service = TestBed.inject(SaleFoldersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista carpetas sin branchId', () => {
    service.list().subscribe((res) => expect(res.data).toEqual([folder]));

    const req = http.expectOne(API);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush(ok([folder]));
  });

  it('lista carpetas con branchId de super admin', () => {
    service.list('branch-1').subscribe();

    const req = http.expectOne((r) => r.url === API && r.params.get('branchId') === 'branch-1');
    expect(req.request.method).toBe('GET');
    req.flush(ok([folder]));
  });

  it('no envía branchId vacío o null', () => {
    service.list(null).subscribe();
    const req = http.expectOne(API);
    expect(req.request.params.has('branchId')).toBeFalse();
    req.flush(ok([]));
  });

  it('obtiene el detalle con sales', () => {
    service.get('folder-1').subscribe((res) => expect(res.data.sales.length).toBe(1));

    const req = http.expectOne(`${API}/folder-1`);
    expect(req.request.method).toBe('GET');
    req.flush(ok({ ...folder, sales: [{ saleId: 'sale-1', invoiceNumber: 'F-1', customerName: 'A', status: 'pending', total: 10, date: '', sortOrder: 0 }] }));
  });

  it('crea carpeta', () => {
    service.create({ name: 'Navidad 2026', color: '#c2410c', branchId: 'branch-1' }).subscribe();

    const req = http.expectOne(API);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Navidad 2026', color: '#c2410c', branchId: 'branch-1' });
    req.flush(ok(folder));
  });

  it('actualiza carpeta', () => {
    service.update('folder-1', { name: 'Reyes' }).subscribe();

    const req = http.expectOne(`${API}/folder-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Reyes' });
    req.flush(ok({ ...folder, name: 'Reyes' }));
  });

  it('elimina carpeta', () => {
    service.delete('folder-1').subscribe();

    const req = http.expectOne(`${API}/folder-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(ok(undefined));
  });

  it('mete órdenes con saleIds', () => {
    service.addSales('folder-1', { saleIds: ['sale-1', 'sale-2'] }).subscribe();

    const req = http.expectOne(`${API}/folder-1/sales`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ saleIds: ['sale-1', 'sale-2'] });
    req.flush(ok(folder));
  });

  it('saca una orden de la carpeta', () => {
    service.removeSale('folder-1', 'sale-9').subscribe();

    const req = http.expectOne(`${API}/folder-1/sales/sale-9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(ok(undefined));
  });

  it('reordena con sortOrder', () => {
    const body = { items: [{ saleId: 'sale-1', sortOrder: 0 }, { saleId: 'sale-2', sortOrder: 1 }] };
    service.reorder('folder-1', body).subscribe();

    const req = http.expectOne(`${API}/folder-1/sales/reorder`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(ok(undefined));
  });
});
