import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { LowStockAlertDto } from '../../../core/models/reports.models';

@Component({
  selector: 'app-stock-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stock-alerts.component.html',
})
export class StockAlertsComponent implements OnInit, OnDestroy {

  private _alerts: LowStockAlertDto[] = [];
  @Input() set alerts(value: LowStockAlertDto[]) {
    this._alerts = value;
    this.startAlertsCycle();
  }
  get alerts() { return this._alerts; }

  
  currentAlertIndex = signal(0);
  private alertsInterval: any;

  currentAlert = computed(() => {
    if (!this.alerts || this.alerts.length === 0) return null;
    return this.alerts[this.currentAlertIndex() % this.alerts.length];
  });

  ngOnInit() {
    this.startAlertsCycle();
  }

  ngOnDestroy() {
    this.stopAlertsCycle();
  }

  private startAlertsCycle() {
    this.stopAlertsCycle();
    if (this.alerts && this.alerts.length > 1) {
      this.alertsInterval = setInterval(() => {
        this.currentAlertIndex.update(idx => idx + 1);
      }, 8000); // 8 seconds per alert
    }
  }

  private stopAlertsCycle() {
    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }
  }
}
