import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-piloto-layout',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './piloto-layout.component.html',
  styleUrl: './piloto-layout.component.css',
})
export class PilotoLayoutComponent {
  private auth = inject(AuthService);

  userName = this.auth.currentUser?.name ?? 'Piloto';

  logout(): void {
    this.auth.logout();
  }
}
