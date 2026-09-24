import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { OrdersService } from './orders.service';
import { ApiResponse } from '../../core/models/api-response.model';
import { PaginatedResponse } from './orders.service';
import { ISaleOrderResponse } from '../interfaces/sale-order.interface';

const API = `${environment.apiUrl}/sales`;

function ok<T>(data: T): ApiResponse<T> {
  return { statusCode: 200, message: 'ok', data, timestamp: '', path: '' };
}

describe('OrdersService folderId', () => {
  let service: OrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), OrdersService],
    });
    service = TestBed.inject(OrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía folderId en GET /sales/table', () => {
    const page: PaginatedResponse<ISaleOrderResponse> = { data: [], total: 0, page: 1, limit: 50, lastPage: 1 };
    service.getSalesTable({ folderId: 'folder-1', page: 1, limit: 50 }).subscribe();

    const req = http.expectOne((r) => r.url === `${API}/table`);
    expect(req.request.params.get('folderId')).toBe('folder-1');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('50');
    req.flush(ok(page));
  });

  it('no envía folderId si no viene en el filtro', () => {
    const page: PaginatedResponse<ISaleOrderResponse> = { data: [], total: 0, page: 1, limit: 50, lastPage: 1 };
    service.getSalesTable({ page: 1, startDate: '2026-03-23', endDate: '2026-09-23' }).subscribe();

    const req = http.expectOne((r) => r.url === `${API}/table`);
    expect(req.request.params.has('folderId')).toBeFalse();
    expect(req.request.params.get('startDate')).toBe('2026-03-23');
    req.flush(ok(page));
  });
});
