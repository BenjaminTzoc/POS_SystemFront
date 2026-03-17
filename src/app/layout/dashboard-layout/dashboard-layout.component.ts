import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { ModernSidebarComponent } from '../modern-sidebar/modern-sidebar.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-dashboard-layout',
  imports: [HeaderComponent, ModernSidebarComponent, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent {
  isSidebarCollapsed = false;

  onToggleSidebar(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }
}
