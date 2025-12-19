import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { DiscountTypePipe } from '../../shared/pipes/discount-type.pipe';

@Component({
  selector: 'app-sale-discounts',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    ToggleButtonModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    TableModule,
    DiscountTypePipe,
  ],
  templateUrl: './sale-discounts.component.html',
  styleUrl: './sale-discounts.component.css',
})
export class SaleDiscountsComponent {
  discountForm!: FormGroup;

  isFixedAmount: boolean = false;

  private _discounts: any[] = [];

  @Input() set discounts(value: any[]) {
    this._discounts = value ? [...value] : [];
  }
  private _visible: boolean = false;

  @Input()
  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    this._visible = value;
    if (this._visible) {
      this.resetForm();
    }
  }
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() discountsChanged = new EventEmitter<any[]>();

  get discounts() {
    return this._discounts;
  }

  constructor(private fb: FormBuilder) {
    this.discountForm = this.fb.group({
      type: ['percent', [Validators.required]],
      value: [0, [Validators.required, Validators.min(0.01), Validators.max(100)]],
      reason: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  onToggleType(): void {
    const type = this.isFixedAmount ? 'amount' : 'percent';
    this.discountForm.get('type')?.setValue(type);

    const valueControl = this.discountForm.get('value');
    if (type === 'percent') {
      valueControl?.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
    } else {
      valueControl?.setValidators([Validators.required, Validators.min(0.01)]);
    }
    valueControl?.updateValueAndValidity();
  }

  addDiscount(): void {
    if (this.discountForm.invalid) {
      this.discountForm.markAllAsTouched();
      return;
    }
    this._discounts = [...this._discounts, this.discountForm.value];
    this.discountsChanged.emit([...this._discounts]);
    this.resetForm();
  }

  resetForm(): void {
    const currentType = this.discountForm?.get('type')?.value || 'percent';
    this.isFixedAmount = currentType === 'amount';
    this.discountForm?.reset({
      type: currentType,
      value: 0,
      reason: '',
    });
  }

  clearDiscounts(): void {
    this._discounts = [];
    this.discountsChanged.emit([]);
  }

  removeDiscount(index: number): void {
    this._discounts = this._discounts.filter((_, i) => i !== index);
    this.discountsChanged.emit([...this._discounts]);
  }

  save(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}
