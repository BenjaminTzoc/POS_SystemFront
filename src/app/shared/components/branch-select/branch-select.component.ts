import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-branch-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => BranchSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './branch-select.component.html',
})
export class BranchSelectComponent implements ControlValueAccessor {
  /** Lista de sucursales disponibles */
  @Input() branches: any[] = [];

  get sortedBranches(): any[] {
    if (!this.branches || this.branches.length === 0) return [];
    return [...this.branches].sort((a, b) => {
      const aPlant = !!a.isPlant;
      const bPlant = !!b.isPlant;
      if (aPlant && !bPlant) return -1;
      if (!aPlant && bPlant) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  /** Placeholder (por defecto: 'Todas las sucursales') */
  @Input() placeholder = 'Todas las sucursales';

  /** Permite limpiar el valor seleccionado */
  @Input() showClear = true;

  /** Deshabilitar el componente */
  @Input() disabled = false;

  /** Ancho responsivo del selector (por defecto: 'md:w-[18rem]') */
  @Input() widthClass = 'md:w-[18rem] md:min-w-[18rem] md:max-w-[18rem]';

  /** Tamaño del selector (ej. 'small' para h-8 en cabeceras compactas) */
  @Input() size?: 'small' | 'large';

  /** Evento emitido al cambiar el valor */
  @Output() selectionChange = new EventEmitter<string | null>();

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
  }
}
