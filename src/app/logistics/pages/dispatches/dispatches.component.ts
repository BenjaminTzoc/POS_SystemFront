import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SelectModule } from 'primeng/select';
import { RippleModule } from 'primeng/ripple';
import { LucideCirclePlus, LucideRefreshCw, LucideEye, LucideCalculator, LucidePackageCheck } from '@lucide/angular';

import { LogisticsService } from '../../services/logistics.service';
import { RouteDispatch } from '../../interfaces/route-dispatch.interface';
import { BranchesService } from '../../../inventory/services/branches.service';
import { Branch } from '../../../inventory/interfaces/branch.interface';
import { AuthService } from '../../../auth/auth.service';

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
    FormsModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    RippleModule,
    LucideCirclePlus,
    LucideRefreshCw,
    LucideEye,
    LucideCalculator,
    LucidePackageCheck
  ],
  providers: [],
  templateUrl: './dispatches.component.html'
})
export class DispatchesComponent implements OnInit {
  private logisticsService = inject(LogisticsService);
  private branchesService = inject(BranchesService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  dispatches = signal<RouteDispatch[]>([]);
  branches = signal<Branch[]>([]);
  loading = signal(false);
  searchTerm = signal<string>('');
  selectedStatus = signal<string | null>(null);
  selectedBranch = signal<string | null>(null);
  expandedRows = signal<any>({});

  statusOptions = [
    { label: 'En Camino', value: 'sent' },
    { label: 'Recibido', value: 'received' },
    { label: 'Pendiente Liquidar', value: 'reconciled' },
    { label: 'Liquidado', value: 'closed' },
    { label: 'Cancelado', value: 'cancelled' }
  ];

  isSuperAdmin = computed(() => {
    return this.authService.currentUser?.roles?.some(r => r.isSuperAdmin) ?? false;
  });

  filteredDispatches = computed(() => {
    let list = this.dispatches();
    const status = this.selectedStatus();
    const branchId = this.selectedBranch();
    const term = this.searchTerm().toLowerCase().trim();

    if (status) {
      list = list.filter(d => d.status === status);
    }
    if (branchId) {
      list = list.filter(d => d.branch?.id === branchId || d.originBranch?.id === branchId);
    }
    if (term) {
      list = list.filter(d => 
        d.branch?.name?.toLowerCase().includes(term) ||
        d.originBranch?.name?.toLowerCase().includes(term) ||
        d.responsible?.name?.toLowerCase().includes(term) ||
        d.notes?.toLowerCase().includes(term)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadBranches();
    this.loadDispatches();
  }

  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.branches.set(res.data);
        }
      }
    });
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

  getStatusLabel(status?: string): string {
    if (!status) return '---';
    const labels: Record<string, string> = {
      'sent': 'En Camino',
      'received': 'Recibido',
      'reconciled': 'Pendiente Liquidar',
      'closed': 'Liquidado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status?: string): 'info' | 'warn' | 'success' | 'danger' {
    if (!status) return 'info';
    const severities: Record<string, 'info' | 'warn' | 'success' | 'danger'> = {
      'sent': 'info',
      'received': 'warn',
      'reconciled': 'warn',
      'closed': 'success',
      'cancelled': 'danger'
    };
    return severities[status] || 'info';
  }

  navigate(id: string | undefined, action: string) {
    if (!id) return;
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
