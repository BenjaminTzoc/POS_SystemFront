import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-standard-modal',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './standard-modal.component.html',
})
export class StandardModalComponent {
  /** Visibilidad del modal (two-way binding: [(visible)]) */
  @Input() visible = false;

  /** Título principal del modal */
  @Input() title = '';

  /** Badge opcional de cantidad o estado al lado del título (ej. '3 registros', 'Activo') */
  @Input() badge?: string;

  /** Ancho responsivo del modal (por defecto: 92vw, max 1400px) */
  @Input() width = '92vw';
  @Input() maxWidth = '1400px';
  @Input() maxHeight = '90vh';

  /** Cerrar al hacer clic fuera del modal */
  @Input() dismissableMask = true;

  /** Cerrar al presionar tecla Escape */
  @Input() closeOnEscape = true;

  /** Evento emitido al cerrar o cambiar visibilidad */
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event?: Event): void {
    if (this.visible && this.closeOnEscape) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      this.close();
    }
  }

  onHide(): void {
    if (this.visible) {
      this.visible = false;
      this.visibleChange.emit(false);
      this.closed.emit();
    }
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.closed.emit();
  }
}
