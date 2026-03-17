import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CashRegisterService } from '../../inventory/services/cash-register.service';
import { CashSession } from '../../inventory/interfaces/cash-register.interface';
import { BranchesService } from '../../inventory/services/branches.service';
import { AuthService } from '../../auth/auth.service';
import { Branch } from '../../inventory/interfaces/branch.interface';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    TooltipModule,
    CurrencyPipe,
    DatePipe,
    SelectModule,
    TextareaModule,
    DialogModule,
  ],
  templateUrl: './cash-register.component.html',
  styleUrl: './cash-register.component.css',
})
export class CashRegisterComponent implements OnInit {
  private cashService = inject(CashRegisterService);
  private branchesService = inject(BranchesService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  get user() {
    return this.authService.currentUser;
  }

  // Status
  get currentSession() {
    return this.cashService.currentSession;
  }
  isLoadingStatus = signal<boolean>(false);
  
  // Nombres resueltos para la UI
  sessionBranchName = signal<string>('');
  sessionUserName = signal<string>('');

  // Forms
  openForm!: FormGroup;
  closeForm!: FormGroup;

  // Auxiliary
  branches: Branch[] = [];
  isLoading = false;
  showCalculationDialog = false;

  // Desglose de denominaciones (GTQ)
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

  get calculatedTotal() {
    return this.denominations.reduce((acc, d) => acc + (d.value * (d.count || 0)), 0);
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

  ngOnInit(): void {
    this.checkStatus();
    this.loadBranches();
    this.initForms();
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
    this.isLoadingStatus.set(true);
    this.cashService.getStatus().subscribe({
      next: (res) => {
        if (res.data) {
          this.loadSessionDetails(res.data);
        }
        this.isLoadingStatus.set(false);
      },
      error: () => this.isLoadingStatus.set(false),
    });
  }

  loadSessionDetails(session: CashSession) {
    this.sessionUserName.set(this.user?.name || 'Usuario');
    
    // Si no tenemos sucursales cargadas aún, esperamos o buscamos
    if (this.branches.length > 0) {
      const branch = this.branches.find(b => b.id === session.branchId);
      this.sessionBranchName.set(branch?.name || session.branchName || 'Sucursal');
    } else {
      this.branchesService.getBranch(session.branchId).subscribe({
        next: (res) => this.sessionBranchName.set(res.data.name),
        error: () => this.sessionBranchName.set(session.branchName || 'Sucursal')
      });
    }
  }

  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: (res) => (this.branches = res.data),
    });
  }

  openCash() {
    if (this.openForm.invalid) return;

    this.isLoading = true;
    this.cashService.open(this.openForm.value).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Caja Abierta',
          detail: 'La sesión se inició correctamente',
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo abrir la caja',
        });
        this.isLoading = false;
      },
    });
  }

  closeCash() {
    const session = this.currentSession();
    if (this.closeForm.invalid || !session) return;

    this.isLoading = true;
    this.cashService.close(session.id, this.closeForm.value).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Caja Cerrada',
          detail: `Arqueo finalizado con diferencia de ${res.data.difference}`,
        });
        this.isLoading = false;
        this.openForm.reset({ openingBalance: 0, branchId: '', notes: '' });
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'No se pudo cerrar la caja',
        });
        this.isLoading = false;
      },
    });
  }
}
