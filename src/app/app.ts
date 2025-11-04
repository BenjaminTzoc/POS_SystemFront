import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterOutlet, Toast, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService]
})
export class App {
  protected readonly title = signal('sistema-pos-frontend');
}
