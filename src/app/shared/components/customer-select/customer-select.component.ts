import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ICustomer } from '../../../sales/interfaces/customer.interface';

@Component({
  selector: 'app-customer-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomerSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './customer-select.component.html',
})
export class CustomerSelectComponent implements ControlValueAccessor {
  /** Lista de clientes disponibles */
  @Input() customers: ICustomer[] = [];

  /** Placeholder */
  @Input() placeholder = 'Seleccione un cliente...';

  /** Permite limpiar el valor seleccionado */
  @Input() showClear = true;

  /** Deshabilitar el componente */
  @Input() disabled = false;

  /** Ancho o clases de contenedor */
  @Input() widthClass = 'w-full';

  /** Tamaño del selector (ej. 'small') */
  @Input() size?: 'small' | 'large';

  /** Evento emitido al cambiar el valor del id */
  @Output() selectionChange = new EventEmitter<string | null>();

  /** Evento emitido con el objeto cliente completo */
  @Output() customerChange = new EventEmitter<ICustomer | undefined>();

  value: string | null = null;

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string | null): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(newVal: string | null): void {
    this.value = newVal;
    this.onChange(newVal);
    this.onTouched();
    this.selectionChange.emit(newVal);
    const selected = this.customers.find(c => c.id === newVal);
    this.customerChange.emit(selected);
  }
}
