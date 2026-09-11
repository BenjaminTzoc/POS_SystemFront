import { Component, inject, OnInit, signal, Input, ViewChild, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

// Services/Interfaces
import { BankAccountsService } from '../services/bank-accounts.service';
import { IBankAccount } from '../interfaces/bank-account.interface';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-bank-accounts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    TooltipModule,
    ToggleSwitchModule,
    DialogModule,
    InputNumberModule,
    SelectModule
  ],
  templateUrl: './bank-accounts.component.html',
})
export class BankAccountsComponent implements OnInit {
  private bankService = inject(BankAccountsService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  @Input() isDialogMode = false;
  @Output() close = new EventEmitter<void>();

  @ViewChild('dt') dt!: Table;
  @ViewChild('dtMobile') dtMobile!: Table;

  bankAccounts = signal<IBankAccount[]>([]);
  loading = signal(false);
  searchQuery = signal<string>('');

  filteredBankAccounts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.bankAccounts();
    if (!q) return list;
    return list.filter(acc => 
      acc.alias?.toLowerCase().includes(q) || 
      acc.bankName?.toLowerCase().includes(q) || 
      acc.accountNumber?.toLowerCase().includes(q) || 
      acc.holderName?.toLowerCase().includes(q)
    );
  });

  // Dialog management
  displayFormDialog = false;
  isEditMode = false;
  isSaving = false;
  selectedAccountId: string | null = null;
  bankAccountForm: FormGroup;

  accountTypeOptions = [
    { label: 'Monetaria', value: 'Monetaria' },
    { label: 'Ahorros', value: 'Ahorros' },
    { label: 'Otros', value: 'Otros' }
  ];

  constructor() {
    this.bankAccountForm = this.fb.group({
      bankName: ['', [Validators.required, Validators.minLength(2)]],
      accountNumber: ['', [Validators.required, Validators.minLength(5)]],
      holderName: ['', [Validators.required, Validators.minLength(3)]],
      accountType: ['Monetaria', [Validators.required]],
      alias: ['', [Validators.required, Validators.minLength(2)]],
      balance: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  get canManage(): boolean {
    return this.authService.currentUser?.roles?.some(r => r.isSuperAdmin || r.name === 'Admin' || r.permissions?.some((p: any) => p.code === 'payment-methods.manage')) ?? true;
  }

  ngOnInit(): void {
    this.loadBankAccounts();
  }

  loadBankAccounts(): void {
    this.loading.set(true);
    this.bankService.getBankAccounts().subscribe({
      next: (res) => {
        this.bankAccounts.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las cuentas bancarias' });
        this.loading.set(false);
      }
    });
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.dt) {
      this.dt.filterGlobal(value, 'contains');
    }
    if (this.dtMobile) {
      this.dtMobile.filterGlobal(value, 'contains');
    }
  }

  onSearchDialog(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  onCloseCatalog(): void {
    this.close.emit();
  }

  onEditAccountInline(account: IBankAccount): void {
    this.isEditMode = true;
    this.selectedAccountId = account.id;
    this.bankAccountForm.patchValue({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      holderName: account.holderName,
      alias: account.alias,
      balance: account.balance,
      isActive: account.isActive
    });
    const matchedType = this.accountTypeOptions.find(o => account.alias?.toLowerCase().includes(o.value.toLowerCase()));
    this.bankAccountForm.patchValue({
      accountType: matchedType ? matchedType.value : 'Monetaria'
    });
  }

  onCancelEdit(): void {
    this.isEditMode = false;
    this.selectedAccountId = null;
    this.bankAccountForm.reset({
      bankName: '',
      accountNumber: '',
      holderName: '',
      accountType: 'Monetaria',
      alias: '',
      balance: 0,
      isActive: true
    });
  }

  openNewDialog(): void {
    this.isEditMode = false;
    this.selectedAccountId = null;
    this.bankAccountForm.reset({
      bankName: '',
      accountNumber: '',
      holderName: '',
      accountType: 'Monetaria',
      alias: '',
      balance: 0,
      isActive: true
    });
    this.displayFormDialog = true;
  }

  openEditDialog(account: IBankAccount): void {
    this.isEditMode = true;
    this.selectedAccountId = account.id;
    this.bankAccountForm.patchValue({
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      holderName: account.holderName,
      accountType: account.alias ? account.alias.includes('Ahorros') ? 'Ahorros' : 'Monetaria' : 'Monetaria',
      alias: account.alias,
      balance: account.balance,
      isActive: account.isActive
    });
    if (account.id) {
      const matchedType = this.accountTypeOptions.find(o => account.alias?.toLowerCase().includes(o.value.toLowerCase()));
      this.bankAccountForm.patchValue({
        accountType: matchedType ? matchedType.value : 'Monetaria'
      });
    }
    this.displayFormDialog = true;
  }

  onSaveAccount(): void {
    if (this.bankAccountForm.invalid) {
      this.bankAccountForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const body = this.bankAccountForm.value;

    if (this.isEditMode && this.selectedAccountId) {
      this.bankService.updateBankAccount(this.selectedAccountId, body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta bancaria actualizada correctamente' });
          this.isSaving = false;
          this.loadBankAccounts();
          if (this.isDialogMode) {
            this.onCancelEdit();
          } else {
            this.displayFormDialog = false;
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al actualizar' });
          this.isSaving = false;
        }
      });
    } else {
      this.bankService.createBankAccount(body).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta bancaria creada correctamente' });
          this.isSaving = false;
          this.loadBankAccounts();
          if (this.isDialogMode) {
            this.onCancelEdit();
          } else {
            this.displayFormDialog = false;
          }
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear' });
          this.isSaving = false;
        }
      });
    }
  }

  onDeleteAccount(account: IBankAccount): void {
    this.confirmationService.confirm({
      message: `¿Está seguro de eliminar la cuenta: ${account.alias} (${account.bankName})?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger !rounded-xl',
      rejectButtonStyleClass: 'p-button-secondary p-button-text !rounded-xl',
      accept: () => {
        this.bankService.deleteBankAccount(account.id).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Cuenta bancaria eliminada' });
            this.loadBankAccounts();
            if (this.isDialogMode) {
              this.onCancelEdit();
            }
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'No se pudo eliminar la cuenta' });
          }
        });
      }
    });
  }
}
