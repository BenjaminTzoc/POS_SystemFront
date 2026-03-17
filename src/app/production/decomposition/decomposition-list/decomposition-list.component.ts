import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { DecompositionService } from '../../services/decomposition.service';
import { IDecompositionResponse } from '../../interfaces/decomposition.interface';

@Component({
  selector: 'app-decomposition-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    InputTextModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './decomposition-list.component.html',
})
export class DecompositionListComponent implements OnInit {
  private decompositionService = inject(DecompositionService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  decompositions = signal<IDecompositionResponse[]>([]);
  loading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadDecompositions();
  }

  loadDecompositions(): void {
    this.loading.set(true);
    this.decompositionService.getDecompositions().subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.decompositions.set(res.data);
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los despieces'
        });
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }

  createDecomposition(): void {
    this.router.navigate(['/production/decomposition/new']);
  }

  viewDetail(id: string): void {
    this.router.navigate(['/production/decomposition/detail', id]);
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
