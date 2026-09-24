import {
  Component,
  Input,
  Output,
  EventEmitter,
  ContentChild,
  TemplateRef,
  ViewChild,
  forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';

@Component({
  selector: 'app-standard-table',
  standalone: true,
  imports: [CommonModule, TableModule],
  templateUrl: './standard-table.component.html',
  styleUrl: './standard-table.component.css',
})
export class StandardTableComponent {
  @Input() value: any[] = [];
  @Input() loading: boolean = false;
  @Input() paginator: boolean = true;
  @Input() rows: number = 10;
  @Input() first: number = 0;
  @Input() totalRecords: number = 0;
  @Input() lazy: boolean = false;
  @Input() rowsPerPageOptions: number[] = [10, 15, 20, 25, 50];
  @Input() showRowsPerPageDropdown: boolean = true;
  @Input() dataKey: string = 'id';
  @Input() globalFilterFields: string[] = [];
  @Input() scrollable: boolean = false;
  @Input() scrollHeight?: string;
  @Input() emptyIcon: string = 'pi pi-inbox';
  @Input() emptyMessage: string = 'Aún no hay registros disponibles';
  @Input() customClass: string = '';
  @Input() colorScheme: 'burgundy' | 'navy' | 'slate' | 'purple' = 'burgundy';

  get containerClass(): string {
    switch (this.colorScheme) {
      case 'purple':
        return 'theme-purple bg-white border-[#93679c]/30';
      case 'navy':
        return 'theme-navy bg-white border-slate-200';
      case 'slate':
        return 'theme-slate bg-white border-slate-200';
      case 'burgundy':
      default:
        return 'theme-burgundy bg-slate-50 border-[#48021C]/25';
    }
  }

  @Output() rowSelect = new EventEmitter<any>();
  @Output() rowUnselect = new EventEmitter<any>();
  @Output() onLazyLoad = new EventEmitter<any>();
  @Output() onRowExpand = new EventEmitter<any>();
  @Output() onRowCollapse = new EventEmitter<any>();

  @ContentChild('header') headerTemplate?: TemplateRef<any>;
  @ContentChild('body') bodyTemplate?: TemplateRef<any>;
  @ContentChild('expandedrow') expandedRowTemplate?: TemplateRef<any>;
  @ContentChild('emptymessage') emptyMessageTemplate?: TemplateRef<any>;
  @ContentChild('footer') footerTemplate?: TemplateRef<any>;

  @ViewChild('dataTable', { static: false }) dataTable!: Table;

  /**
   * Delegates toggleRow to inner PrimeNG table so [pRowToggler] works seamlessly
   */
  toggleRow(data: any, event?: Event): void {
    if (this.dataTable) {
      this.dataTable.toggleRow(data, event);
    }
  }

  /**
   * Delegates global filtering
   */
  filterGlobal(value: string, matchMode: string = 'contains'): void {
    if (this.dataTable) {
      this.dataTable.filterGlobal(value, matchMode);
    }
  }

  /**
   * Clears table filters/sorts
   */
  clear(): void {
    if (this.dataTable) {
      this.dataTable.clear();
    }
  }
}
