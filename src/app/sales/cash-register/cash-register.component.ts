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
    TooltipModule,
    CurrencyPipe,
    SelectModule,
    TextareaModule,
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
  currentSession = signal<CashSession | null>(null);
  isLoadingStatus = signal<boolean>(false);

  // Forms
  openForm!: FormGroup;
  closeForm!: FormGroup;

  // Auxiliary
  branches: Branch[] = [];
  isLoading = false;

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
        this.currentSession.set(res.data);
        this.isLoadingStatus.set(false);
      },
      error: () => this.isLoadingStatus.set(false),
    });
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
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Caja Abierta',
          detail: 'La sesión se inició correctamente',
        });
        this.currentSession.set(res.data);
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
    if (this.closeForm.invalid || !this.currentSession()) return;

    this.isLoading = true;
    this.cashService.close(this.currentSession()!.id, this.closeForm.value).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Caja Cerrada',
          detail: `Arqueo finalizado con diferencia de ${res.data.difference}`,
        });
        this.currentSession.set(null);
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
