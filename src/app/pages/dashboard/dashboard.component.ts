import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchesService } from '../../inventory/services/branches.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { AuthService } from '../../auth/auth.service';
import { BranchSelectComponent } from '../../shared/components/branch-select/branch-select.component';
import { CustomerWeekWidgetComponent } from './components/customer-week-widget/customer-week-widget.component';
import { TodayPulseComponent } from './components/today-pulse/today-pulse.component';
import { CollectionsCalendarComponent } from './components/collections-calendar/collections-calendar.component';
import { TodayPaymentsComponent } from './components/today-payments/today-payments.component';
import { DashboardFilterService } from './dashboard-filter.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BranchSelectComponent,
    CustomerWeekWidgetComponent,
    TodayPulseComponent,
    CollectionsCalendarComponent,
    TodayPaymentsComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DashboardFilterService],
})
export class DashboardComponent implements OnInit {
  selectedBranchId = signal<string | null>(null);
  branches = signal<Branch[]>([]);

  private authService = inject(AuthService);
  private branchesService = inject(BranchesService);
  private dashboardFilter = inject(DashboardFilterService);

  readonly canFilterByBranch = computed(() => {
    const user = this.authService.currentUser;
    return user?.roles?.some((r) => r.isSuperAdmin || r.name === 'Admin') ?? false;
  });

  ngOnInit(): void {
    if (this.canFilterByBranch()) {
      this.loadBranches();
    }
  }

  onBranchChange(branchId: string | null) {
    this.selectedBranchId.set(branchId);
    this.dashboardFilter.setBranchId(branchId);
  }

  private loadBranches() {
    this.branchesService.getBranches({ minimal: true }).subscribe({
      next: (res) => this.branches.set(res.data ?? []),
    });
  }
}
