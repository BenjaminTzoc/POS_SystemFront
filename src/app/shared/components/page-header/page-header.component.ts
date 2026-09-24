import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule],
  templateUrl: './page-header.component.html',
})
export class PageHeaderComponent {
  /** Título principal de la pantalla */
  @Input() title: string = '';

  /** Subtítulo o descripción breve opcional */
  @Input() subtitle?: string;

  /** Clase del icono (ej. 'pi pi-box', 'pi pi-shopping-cart', etc.) */
  @Input() icon?: string;

  /** Mostrar botón de volver al lado del título */
  @Input() showBackButton: boolean = false;

  /** Tooltip del botón de volver */
  @Input() backTooltip: string = 'Volver';

  /** Badge opcional al lado del título (ej. 'Borrador', 'Edición') */
  @Input() badge?: string;

  /** Severidad del badge */
  @Input() badgeSeverity: 'burgundy' | 'warn' | 'success' | 'info' | 'secondary' = 'burgundy';

  /** Evento al hacer clic en volver */
  @Output() onBack = new EventEmitter<void>();

  /** Variante de color del borde y encabezado: 'burgundy' (default), 'navy', 'indigo', 'emerald' */
  @Input() colorScheme: 'burgundy' | 'navy' | 'indigo' | 'emerald' = 'burgundy';

  get borderClass(): string {
    switch (this.colorScheme) {
      case 'navy': return 'border-[#1e3a5f]/25';
      case 'indigo': return 'border-indigo-600/25';
      case 'emerald': return 'border-emerald-600/25';
      case 'burgundy':
      default:
        return 'border-[#48021C]/25';
    }
  }

  get headerBgClass(): string {
    switch (this.colorScheme) {
      case 'navy': return 'bg-slate-100/70 border-[#1e3a5f]/15';
      case 'indigo': return 'bg-indigo-50/60 border-indigo-600/15';
      case 'emerald': return 'bg-emerald-50/60 border-emerald-600/15';
      case 'burgundy':
      default:
        return 'bg-rose-50/60 border-[#48021C]/15';
    }
  }

  get iconBoxClass(): string {
    switch (this.colorScheme) {
      case 'navy': return 'bg-[#1e3a5f]/10 text-[#1e3a5f] border-[#1e3a5f]/20';
      case 'indigo': return 'bg-indigo-600/10 text-indigo-700 border-indigo-600/20';
      case 'emerald': return 'bg-emerald-600/10 text-emerald-700 border-emerald-600/20';
      case 'burgundy':
      default:
        return 'bg-[#48021C]/10 text-[#48021C] border-[#48021C]/20';
    }
  }

  get badgeClass(): string {
    switch (this.badgeSeverity) {
      case 'warn':
        return 'bg-amber-50 text-amber-700 border border-amber-300';
      case 'success':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-300';
      case 'info':
        return 'bg-sky-50 text-sky-700 border border-sky-300';
      case 'secondary':
        return 'bg-slate-100 text-slate-700 border border-slate-300';
      case 'burgundy':
      default:
        return 'bg-[#9f6587]/15 text-[#48021C] border border-[#9f6587]/30';
    }
  }
}
