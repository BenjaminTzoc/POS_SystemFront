import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, IconFieldModule, InputIconModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchInputComponent),
      multi: true,
    },
  ],
  templateUrl: './search-input.component.html',
})
export class SearchInputComponent implements ControlValueAccessor {
  /** Placeholder del buscador */
  @Input() placeholder = 'Buscar por producto o SKU...';

  /** Ancho responsivo del buscador (por defecto: 'md:w-[30rem]') */
  @Input() widthClass = 'w-full md:w-[30rem]';

  /** Evento emitido al escribir o limpiar el buscador */
  @Output() searchChange = new EventEmitter<string>();

  value: string = '';

  private onChange: (val: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value = val || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onModelChange(newVal: string): void {
    this.value = newVal;
    this.onChange(newVal);
    this.onTouched();
    this.searchChange.emit(newVal);
  }

  clear(): void {
    this.onModelChange('');
  }
}
