import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './primary-button.component.html',
})
export class PrimaryButtonComponent {
  /** Texto del botón (ej. 'Nuevo Inventario', 'Nueva Cotización', 'Crear', etc.) */
  @Input() label = 'Nuevo';

  /** Icono de PrimeIcons a mostrar a la izquierda (por defecto 'pi pi-plus') */
  @Input() icon: string = 'pi pi-plus';

  /** Estado de deshabilitado */
  @Input() disabled = false;

  /** Estado de carga */
  @Input() loading = false;

  /** Evento emitido al hacer click */
  @Output() clicked = new EventEmitter<void>();

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
