import { Component, EventEmitter, inject, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MENU_ITEMS, MenuItem } from './menu-items';
import { filter } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<boolean>();
  private router = inject(Router);

  menuItems = MENU_ITEMS;
  activeSubmenu: string | null = null;

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.keepParentOpenOnChildNavigation();
      });
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit(!this.sidebarCollapsed);
  }

  get filteredMenuItems(): MenuItem[] {
    return this.menuItems;
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      if (this.activeSubmenu === item.label) {
        // Si ya está activo, lo cierra
        this.activeSubmenu = null;
      } else {
        // Abre el nuevo y cierra cualquier otro
        this.activeSubmenu = item.label;
      }
    }
  }

  isSubmenuOpen(item: MenuItem): boolean {
    return this.activeSubmenu === item.label;
  }

  isAnyChildActive(item: any): boolean {
    if (!item.children) return false;
    
    const currentUrl = this.router.url;
    return item.children.some((child: any) => 
      child.route && currentUrl.startsWith(child.route)
    );
  }

  private keepParentOpenOnChildNavigation(): void {
    const currentUrl = this.router.url;
    
    // Buscar el padre que contiene la ruta actual en sus hijos
    const activeParent = this.menuItems.find(item => 
      item.children && item.children.some((child: any) => 
        child.route && currentUrl.startsWith(child.route)
      )
    );
    
    if (activeParent) {
      this.activeSubmenu = activeParent.label;
    }
  }

  // Cerrar todos los submenus cuando se colapse el sidebar
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sidebarCollapsed'] && changes['sidebarCollapsed'].currentValue) {
      this.activeSubmenu = null;
    }
  }

  onRouteClick(): void {
    this.activeSubmenu = null;
  }
}
