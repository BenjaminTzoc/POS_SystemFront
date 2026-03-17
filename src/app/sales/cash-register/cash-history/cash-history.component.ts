import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { CashRegisterService } from '../../../inventory/services/cash-register.service';
import { CashSession } from '../../../inventory/interfaces/cash-register.interface';

@Component({
  selector: 'app-cash-history',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, InputTextModule, CurrencyPipe, DatePipe],
  templateUrl: './cash-history.component.html',
  styleUrl: './cash-history.component.css',
})
export class CashHistoryComponent implements OnInit {
  private cashService = inject(CashRegisterService);

  history = signal<CashSession[]>([]);
  isLoadingHistory = signal<boolean>(false);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoadingHistory.set(true);
    this.cashService.getHistory().subscribe({
      next: (res) => {
        this.history.set(res.data);
        this.isLoadingHistory.set(false);
      },
      error: () => this.isLoadingHistory.set(false),
    });
  }
}
