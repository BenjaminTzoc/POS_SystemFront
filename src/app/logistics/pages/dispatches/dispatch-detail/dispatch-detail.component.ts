import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';

import { LogisticsService } from '../../../services/logistics.service';
import { RouteDispatch } from '../../../interfaces/route-dispatch.interface';
import { ApiResponse } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-dispatch-detail',
  standalone: true,
  imports: [
    CommonModule, 
    ButtonModule, 
    TableModule, 
    TagModule, 
    ToastModule, 
    SkeletonModule,
    DatePipe,
    RouterLink
  ],
  providers: [],
  templateUrl: './dispatch-detail.component.html',
})
export class RouteDispatchDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logisticsService = inject(LogisticsService);
  private messageService = inject(MessageService);

  dispatch = signal<RouteDispatch | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDispatch(id);
    }
  }

  loadDispatch(id: string) {
    this.logisticsService.getRouteDispatch(id).subscribe({
      next: (res: ApiResponse<RouteDispatch>) => {
        this.dispatch.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el detalle' });
        this.router.navigate(['/logistics/dispatches']);
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'sent': 'En Camino',
      'received': 'Recibido',
      'closed': 'Liquidado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'info' | 'warn' | 'success' | 'danger' {
    const severities: Record<string, 'info' | 'warn' | 'success' | 'danger'> = {
      'sent': 'info',
      'received': 'warn',
      'closed': 'success',
      'cancelled': 'danger'
    };
    return severities[status] || 'info';
  }

  navigate(action: string) {
    const id = this.dispatch()?.id;
    if (!id) return;
    this.router.navigate([`/logistics/dispatches/${action}`, id]);
  }
}
