import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-refresh-button',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './refresh-button.component.html',
})
export class RefreshButtonComponent {
  /** Estado de carga que hace girar únicamente el icono sin mostrar un spinner que reemplace el botón */
  @Input() loading = false;

  /** Texto del botón (por defecto 'Actualizar') */
  @Input() label = 'Actualizar';

  /** Esquema de color: 'burgundy' (por defecto), 'navy', 'slate' */
  @Input() colorScheme: 'burgundy' | 'navy' | 'slate' = 'burgundy';

  /** Evento emitido al hacer click */
  @Output() refresh = new EventEmitter<void>();

  get buttonStyleClass(): string {
    const base = '!rounded-lg text-sm! font-semibold !bg-white/70 backdrop-blur-md active:scale-[0.98] inline-flex items-center gap-1.5 transition-all duration-200 shadow-xs cursor-pointer disabled:!opacity-50';

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
      case 'slate': return 'text-slate-500';
      case 'burgundy':
      default:
        return 'text-[#48021C]';
    }
  }

  onClick(): void {
    if (!this.loading) {
      this.refresh.emit();
    }
  }
}
