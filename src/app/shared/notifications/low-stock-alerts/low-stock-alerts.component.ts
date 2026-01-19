import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { RouterModule } from '@angular/router';
import { ReportsService } from '../../../core/services/reports.service';
import { LowStockProductDto } from '../../../core/models/reports.models';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [CommonModule, BadgeModule, PopoverModule, ButtonModule, RouterModule],
  templateUrl: './low-stock-alerts.component.html',
  styleUrl: './low-stock-alerts.component.css',
})
export class LowStockAlertsComponent implements OnInit {
  private reportsService = inject(ReportsService);

  lowStockProducts = signal<LowStockProductDto[]>([]);
  lowStockCount = signal<number>(0);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.refreshAlerts();
  }

  refreshAlerts(): void {
    this.loading.set(true);
    // Usamos el resumen del dashboard para obtener el conteo rápido primero
    this.reportsService.getDashboardSummary().subscribe({
      next: (res) => {
        this.lowStockCount.set(res.data.lowStockProductsCount);
        // Si hay productos, podríamos cargar la lista detallada si existiera el endpoint
        // Por ahora simularemos o usaremos el conteo.
        // Simulando carga de detalles (en un sistema real esto sería otro endpoint):
        if (res.data.lowStockProductsCount > 0) {
          // this.loadDetailedLowStock();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // Si habilitamos un endpoint real en el futuro:
  /*
  private loadDetailedLowStock(): void {
    this.reportsService.getLowStockProducts().subscribe({
      next: (res) => this.lowStockProducts.set(res.data),
    });
  }
  */
}
