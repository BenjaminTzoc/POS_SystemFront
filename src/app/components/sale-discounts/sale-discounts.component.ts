import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { DiscountTypePipe } from '../../shared/pipes/discount-type.pipe';

@Component({
  selector: 'app-sale-discounts',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    RadioButtonModule,
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

  discountTypes: any[] = [
    { name: 'Porcentaje (%)', value: 'percentage' },
    { name: 'Monto fijo (Q)', value: 'amount' },
  ];
  private _discounts: any[] = [];

  @Input() set discounts(value: any[]) {
    this._discounts = value ? [...value] : [];
  }
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() discountsChanged = new EventEmitter<any[]>();

  get discounts() {
    return this._discounts;
  }

  constructor(private fb: FormBuilder) {
    this.discountForm = this.fb.group({
      type: ['percentage', [Validators.required]],
      value: [0],
      reason: [''],
    });
  }

  addDiscount(): void {
    this._discounts = [...this._discounts, this.discountForm.value];
    this.discountsChanged.emit([...this._discounts]);
    this.discountForm.patchValue({
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
