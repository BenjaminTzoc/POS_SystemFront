import { Injectable, signal } from '@angular/core';

@Injectable()
export class DashboardFilterService {
  readonly branchId = signal<string | undefined>(undefined);

  setBranchId(id: string | null | undefined) {
    this.branchId.set(id || undefined);
  }
}
