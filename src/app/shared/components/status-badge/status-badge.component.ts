import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeSeverity =
  | 'success'
  | 'danger'
  | 'warn'
  | 'warning'
  | 'info'
  | 'secondary'
  | 'burgundy'
  | 'purple'
  | 'contrast'
  | string;

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input() value?: string | number | null = '';
  @Input() icon?: string = '';
  @Input() severity: BadgeSeverity = 'info';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'sm';
  @Input() rounded: boolean = true;
  @Input() showDot: boolean = true;
  @Input() customClass: string = '';

  get dotClass(): string {
    const dotColorClasses: Record<string, string> = {
      success: 'bg-emerald-600',
      danger: 'bg-rose-600',
      warn: 'bg-amber-600',
      warning: 'bg-amber-600',
      info: 'bg-sky-600',
      secondary: 'bg-slate-500',
      slate: 'bg-slate-500',
      burgundy: 'bg-[#48021C]',
      purple: 'bg-purple-600',
      contrast: 'bg-white'
    };

    const dotSizeClasses: Record<string, string> = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3'
    };

    const normalizedSeverity = (this.severity || 'info').toLowerCase();
    const color = dotColorClasses[normalizedSeverity] || dotColorClasses['info'];
    const size = dotSizeClasses[this.size] || 'w-1.5 h-1.5';

    return `rounded-full flex-shrink-0 ${size} ${color}`;
  }

  get badgeClasses(): string {
    const sizeClasses = {
      xs: 'text-[10px] px-2 py-0.5 gap-1',
      sm: 'text-xs px-2.5 py-1 gap-1.5',
      md: 'text-sm px-3 py-1.5 gap-1.5',
      lg: 'text-base px-3.5 py-2 gap-2'
    }[this.size] || 'text-xs px-2.5 py-1 gap-1.5';

    const colorClasses: Record<string, string> = {
      success: 'bg-[#dcfce7] text-[#14532d] border-emerald-600/35',
      danger: 'bg-[#ffe4e6] text-[#9f1239] border-rose-600/35',
      warn: 'bg-[#fef3c7] text-[#92400e] border-amber-600/35',
      warning: 'bg-[#fef3c7] text-[#92400e] border-amber-600/35',
      info: 'bg-[#e0f2fe] text-[#075985] border-sky-600/35',
      secondary: 'bg-[#f1f5f9] text-[#334155] border-slate-600/25',
      slate: 'bg-[#f1f5f9] text-[#334155] border-slate-600/25',
      burgundy: 'bg-[#48021C]/10 text-[#48021C] border-[#48021C]/25',
      purple: 'bg-[#f3e8ff] text-[#581c87] border-purple-600/35',
      contrast: 'bg-[#1e293b] text-white border-[#0f172a]'
    };

    const normalizedSeverity = (this.severity || 'info').toLowerCase();
    const colorStyle = colorClasses[normalizedSeverity] || colorClasses['info'];

    return `inline-flex items-center justify-center font-semibold border transition-all ${this.rounded ? 'rounded-md' : 'rounded-none'} ${sizeClasses} ${colorStyle} ${this.customClass}`.trim();
  }
}
