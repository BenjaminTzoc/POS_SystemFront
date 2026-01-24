import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        [class.bg-indigo-600]="selectedCategory === null"
        [class.text-white]="selectedCategory === null"
        [class.bg-gray-100]="selectedCategory !== null"
        [class.text-gray-600]="selectedCategory !== null"
        (click)="selectCategory(null)"
        class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:bg-indigo-500 hover:text-white"
      >
        Todos
      </button>

      <button
        *ngFor="let cat of categories"
        [class.bg-indigo-600]="selectedCategory === cat.id"
        [class.text-white]="selectedCategory === cat.id"
        [class.bg-gray-100]="selectedCategory !== cat.id"
        [class.text-gray-600]="selectedCategory !== cat.id"
        (click)="selectCategory(cat.id)"
        class="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:bg-indigo-500 hover:text-white"
      >
        {{ cat.name }}
      </button>
    </div>
  `,
  styles: [
    `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class CategorySelectorComponent {
  @Input() categories: any[] = [];
  @Input() selectedCategory: string | null = null;
  @Output() categorySelected = new EventEmitter<string | null>();

  selectCategory(id: string | null) {
    this.categorySelected.emit(id);
  }
}
