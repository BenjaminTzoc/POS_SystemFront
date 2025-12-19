import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-home',
  imports: [ButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor(
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  confirmLogout(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Confirmar cierre de sesión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, salir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.performLogout();
      },
      reject: () => {
        // Opcional: Mensaje de cancelación
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Cierre de sesión cancelado',
          life: 2000,
        });
      },
    });
  }

  private performLogout(): void {
    this.authService.logout();

    this.messageService.add({
      severity: 'success',
      summary: 'Sesión cerrada',
      detail: 'Has salido de tu cuenta exitosamente',
      life: 3000,
    });
  }
}
