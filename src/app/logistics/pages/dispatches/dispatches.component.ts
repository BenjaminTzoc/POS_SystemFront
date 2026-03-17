import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { LogisticsService } from '../../services/logistics.service';
import { RouteDispatch } from '../../interfaces/route-dispatch.interface';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-dispatches',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    ButtonModule, 
    TableModule, 
    TagModule, 
    ToastModule,
    TooltipModule,
    DatePipe,
    InputTextModule
  ],
  providers: [],
  templateUrl: './dispatches.component.html'
})
export class DispatchesComponent implements OnInit {
  private logisticsService = inject(LogisticsService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  dispatches = signal<RouteDispatch[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadDispatches();
  }

  loadDispatches() {
    this.loading.set(true);
    this.logisticsService.getRouteDispatches().subscribe({
      next: (res) => {
        this.dispatches.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'No se pudieron cargar los despachos' 
        });
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'sent': 'En Camino',
      'received': 'Recibido',
      'reconciled': 'Pendiente Liquidar',
      'closed': 'Liquidado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'info' | 'warn' | 'success' | 'danger' {
    const severities: Record<string, 'info' | 'warn' | 'success' | 'danger'> = {
      'sent': 'info',
      'received': 'warn',
      'reconciled': 'warn',
      'closed': 'success',
      'cancelled': 'danger'
    };
    return severities[status] || 'info';
  }

  navigate(id: string, action: string) {
    switch (action) {
      case 'receive':
        this.router.navigate(['/logistics/dispatches/receive', id]);
        break;
      case 'liquidate':
        this.router.navigate(['/logistics/dispatches/liquidate', id]);
        break;
      case 'detail':
        this.router.navigate(['/logistics/dispatches/detail', id]);
        break;
    }
  }
}
