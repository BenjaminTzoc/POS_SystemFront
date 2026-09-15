import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

export type ConfirmationType = 'warning' | 'danger' | 'success' | 'info' | 'primary';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.css'
})
export class ConfirmationModalComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() header: string = 'Confirmación';
  @Input() title: string = '¿Estás seguro de continuar?';
  @Input() message: string = '';
  @Input() note?: string = '';
  @Input() type: ConfirmationType = 'warning';
  @Input() icon?: string;

  @Input() confirmLabel: string = 'Confirmar';
  @Input() cancelLabel: string = 'Cancelar';
  @Input() confirmIcon: string = 'pi pi-check';
  @Input() loading: boolean = false;
  @Input() width: string = '460px';

  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  get computedIcon(): string {
    if (this.icon) return this.icon;
    switch (this.type) {
      case 'danger':
        return 'pi pi-trash';
      case 'success':
        return 'pi pi-check-circle';
      case 'info':
        return 'pi pi-info-circle';
      case 'primary':
        return 'pi pi-exclamation-circle';
      case 'warning':
      default:
        return 'pi pi-exclamation-triangle';
    }
  }

  get iconContainerClasses(): string {
    switch (this.type) {
      case 'danger':
        return 'bg-rose-50 border-rose-100 text-rose-500';
      case 'success':
        return 'bg-emerald-50 border-emerald-100 text-emerald-600';
      case 'info':
        return 'bg-blue-50 border-blue-100 text-blue-600';
      case 'primary':
        return 'bg-[#48021C]/10 border-[#48021C]/20 text-[#48021C]';
      case 'warning':
      default:
        return 'bg-amber-50 border-amber-100 text-amber-500';
    }
  }

  get confirmButtonClasses(): string {
    switch (this.type) {
      case 'danger':
        return '!bg-rose-600 hover:!bg-rose-700 !border-rose-600 !text-white';
      case 'success':
        return '!bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 !text-white';
      case 'info':
        return '!bg-blue-600 hover:!bg-blue-700 !border-blue-600 !text-white';
      case 'primary':
        return '!bg-[#48021C] hover:!bg-[#350114] !border-[#48021C] !text-white';
      case 'warning':
      default:
        return '!bg-amber-600 hover:!bg-amber-700 !border-amber-600 !text-white';
    }
  }

  handleClose(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.onCancel.emit();
  }

  handleConfirm(): void {
    this.onConfirm.emit();
  }
}
