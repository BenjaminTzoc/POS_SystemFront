import { Component, EventEmitter, Input, Output, inject, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { MENU_ITEMS, MenuItem } from '../sidebar/menu-items';
import { TooltipModule } from 'primeng/tooltip';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { trigger, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-modern-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, TooltipModule],
  templateUrl: './modern-sidebar.component.html',
  styleUrl: './modern-sidebar.component.css',
  animations: [
    trigger('submenuAnimation', [
      transition(':enter', [
        style({ height: '0', opacity: 0, overflow: 'hidden' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1, overflow: 'hidden' }),
        animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class ModernSidebarComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public authService = inject(AuthService);
  private routerSub?: Subscription;

  @Input() collapsed = false;
  @HostBinding('class.collapsed') get isCollapsed() { return this.collapsed; }
  @Output() toggle = new EventEmitter<boolean>();

  menuItems: MenuItem[] = [...MENU_ITEMS];
  expandedItems: Set<string> = new Set();
  activeRoute = '';

  ngOnInit() {
    this.activeRoute = this.router.url;
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = (event as NavigationEnd).urlAfterRedirects;
      this.expandActiveMenu();
    });
    this.expandActiveMenu();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.toggle.emit(!this.collapsed);
  }

  toggleExpand(label: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (this.expandedItems.has(label)) {
      this.expandedItems.delete(label);
    } else {
      this.expandedItems.add(label);
    }
  }

  isExpanded(label: string): boolean {
    return this.expandedItems.has(label);
  }

  isActive(item: MenuItem): boolean {
    if (item.children && item.children.length > 0) {
      return item.children.some(child => this.isActive(child));
    }
    
    return !!item.route && item.route !== '' && this.activeRoute.startsWith(item.route);
  }

  expandActiveMenu() {
    this.menuItems.forEach(item => {
      if (item.children && item.children.some(child => child.route && this.activeRoute.startsWith(child.route))) {
        this.expandedItems.add(item.label);
      }
    });
  }

  logout() {
    this.authService.logout();
  }

  get user() {
    return this.authService.currentUser;
  }

  get userInitials() {
    const name = this.user?.name || 'User';
    return name.split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  trackByLabel(index: number, item: MenuItem) {
    return item.label;
  }
}
