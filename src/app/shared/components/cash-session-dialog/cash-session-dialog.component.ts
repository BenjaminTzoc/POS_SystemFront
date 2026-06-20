import { Component, inject, Input, Output, EventEmitter, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

// Services & Interfaces
import { CashRegisterService } from '../../../inventory/services/cash-register.service';
import { BranchesService } from '../../../inventory/services/branches.service';
import { AuthService } from '../../../auth/auth.service';
import { Branch } from '../../../inventory/interfaces/branch.interface';

@Component({
  selector: 'app-cash-session-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    TooltipModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './cash-session-dialog.component.html',
  styleUrl: './cash-session-dialog.component.css'
})
export class CashSessionDialogComponent implements OnInit {
  private cashService = inject(CashRegisterService);
  private branchesService = inject(BranchesService);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Inputs / Outputs
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() forceActive = false;
  @Output() sessionOpened = new EventEmitter<void>();

  // State
  branches = signal<Branch[]>([]);
  isLoading = signal(false);
  showCalculationDialog = false;
  sessionBranchName = signal<string>('');

  // Forms
  openForm!: FormGroup;
  closeForm!: FormGroup;

  // GTQ Denominations Calculator
  denominations = [
    { label: 'Q 200.00', value: 200, count: 0 },
    { label: 'Q 100.00', value: 100, count: 0 },
    { label: 'Q 50.00', value: 50, count: 0 },
    { label: 'Q 20.00', value: 20, count: 0 },
    { label: 'Q 10.00', value: 10, count: 0 },
    { label: 'Q 5.00', value: 5, count: 0 },
    { label: 'Q 1.00', value: 1, count: 0 },
    { label: 'Q 0.50', value: 0.5, count: 0 },
    { label: 'Q 0.25', value: 0.25, count: 0 },
    { label: 'Q 0.10', value: 0.1, count: 0 },
    { label: 'Q 0.05', value: 0.05, count: 0 },
  ];

  constructor() {
    this.initForms();

    // Automatically load branch details when active session changes
    effect(() => {
      const session = this.currentSession();
      if (session) {
        this.branchesService.getBranch(session.branchId).subscribe({
          next: (res) => this.sessionBranchName.set(res.data.name),
          error: () => this.sessionBranchName.set(session.branchName || 'Sucursal')
        });
      } else {
        this.sessionBranchName.set('');
      }
    });
  }

  ngOnInit(): void {
    this.loadBranches();
    this.checkStatus();
  }

  // Getters
  get currentSession() {
    return this.cashService.currentSession;
  }

  get user() {
    return this.authService.currentUser;
  }

  get calculatedTotal() {
    return this.denominations.reduce((acc, d) => acc + (d.value * (d.count || 0)), 0);
  }

  initForms() {
    this.openForm = this.fb.group({
      openingBalance: [0, [Validators.required, Validators.min(0)]],
      branchId: ['', [Validators.required]],
      notes: [''],
    });

    this.closeForm = this.fb.group({
      closingBalance: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
    });
  }

  checkStatus() {
    this.cashService.getStatus().subscribe();
  }

  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: (res) => {
        this.branches.set(res.data);
        // Pre-select user's branch
        const user: any = this.user;
        const userBranchId = user?.branchId || user?.branch?.id;
        if (userBranchId) {
          this.openForm.get('branchId')?.setValue(userBranchId);
        } else if (res.data.length > 0) {
          this.openForm.get('branchId')?.setValue(res.data[0].id);
        }
      }
    });
  }

  calculateTotal() {
    const total = this.calculatedTotal;
    if (!this.currentSession()) {
      this.openForm.get('openingBalance')?.setValue(total);
    } else {
      this.closeForm.get('closingBalance')?.setValue(total);
    }
    this.showCalculationDialog = false;
  }

  resetDenominations() {
    this.denominations.forEach(d => d.count = 0);
  }

  openCash() {
    if (this.openForm.invalid) return;

    this.isLoading.set(true);
    this.cashService.open(this.openForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Caja Abierta',
          detail: 'La sesión se inició correctamente',
        });
        this.isLoading.set(false);
        this.closeDialog();
        this.sessionOpened.emit();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo abrir la caja',
        });
        this.isLoading.set(false);
      },
    });
  }

  closeCash() {
    const session = this.currentSession();
    if (this.closeForm.invalid || !session) return;

    this.isLoading.set(true);
    this.cashService.close(session.id, this.closeForm.value).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Caja Cerrada',
          detail: `Arqueo finalizado con diferencia de ${res.data.difference}`,
        });
        this.isLoading.set(false);
        this.openForm.reset({ openingBalance: 0, branchId: '', notes: '' });
        // Auto-select user branch again
        const userBranchId = (this.user as any)?.branchId || (this.user as any)?.branch?.id;
        if (userBranchId) {
          this.openForm.get('branchId')?.setValue(userBranchId);
        }
        this.closeDialog();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo cerrar la caja',
        });
        this.isLoading.set(false);
      },
    });
  }

  closeDialog() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  cancel() {
    this.closeDialog();
    if (this.forceActive) {
      this.router.navigate(['/dashboard']);
    }
  }
}
