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
    // Usamos el panel unificado para obtener el conteo de stock bajo (cards.lowStockProductsCount)
    this.reportsService.getUnifiedDashboard(undefined, 1).subscribe({
      next: (res) => {
        this.lowStockCount.set(res.data.cards.lowStockProductsCount);
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
