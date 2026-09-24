import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-secondary-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './secondary-button.component.html',
})
export class SecondaryButtonComponent {
  /** Texto del botón (ej. 'Movimientos', 'Exportar', 'Ver Historial', etc.) */
  @Input() label = '';

  /** Icono de PrimeIcons a mostrar a la izquierda (ej. 'pi pi-history', 'pi pi-download', etc.) */
  @Input() icon?: string;

  /** Variante de color: 'burgundy' (default), 'navy', 'slate' */
  @Input() colorScheme: 'burgundy' | 'navy' | 'slate' = 'burgundy';

  /** Estado de deshabilitado */
  @Input() disabled = false;

  /** Estado de carga */
  @Input() loading = false;

  /** Evento emitido al hacer click */
  @Output() clicked = new EventEmitter<void>();

  get buttonStyleClass(): string {
    const base = '!rounded-lg text-sm! font-semibold !bg-white/70 backdrop-blur-md active:scale-[0.98] inline-flex items-center gap-1.5 transition-all duration-200 cursor-pointer disabled:!opacity-50';

    switch (this.colorScheme) {
      case 'navy':
        return `${base} !border !border-[#1e3a5f]/20 !text-[#1e3a5f] hover:!bg-white hover:!border-[#1e3a5f]/40 hover:!shadow-md hover:!shadow-slate-900/5`;
      case 'slate':
        return `${base} !border !border-slate-300/80 !text-slate-700 hover:!bg-white hover:!border-slate-400 hover:!shadow-md hover:!shadow-slate-900/5`;
      case 'burgundy':
      default:
        return `${base} !border !border-[#48021C]/20 !text-[#48021C] hover:!bg-white hover:!border-[#48021C]/40 hover:!shadow-md hover:!shadow-rose-950/5`;
    }
  }

  get iconClass(): string {
    switch (this.colorScheme) {
      case 'navy': return 'text-[#1e3a5f]';
      case 'slate': return 'text-slate-600';
      case 'burgundy':
      default:
        return 'text-[#48021C]';
    }
  }

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
