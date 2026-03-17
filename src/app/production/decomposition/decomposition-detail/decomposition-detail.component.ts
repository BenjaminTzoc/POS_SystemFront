import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

import { environment } from '../../../../environments/environment';

import { DecompositionService } from '../../services/decomposition.service';
import { IDecompositionResponse } from '../../interfaces/decomposition.interface';

@Component({
  selector: 'app-decomposition-detail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TableModule,
    TagModule,
    DividerModule,
    CurrencyPipe
  ],
  templateUrl: './decomposition-detail.component.html'
})
export class DecompositionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private decompositionService = inject(DecompositionService);
  private messageService = inject(MessageService);

  decomposition = signal<IDecompositionResponse | null>(null);
  loading = signal<boolean>(true);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDecomposition(id);
    } else {
      this.router.navigate(['/production/decomposition']);
    }
  }

  loadDecomposition(id: string): void {
    this.loading.set(true);
    this.decompositionService.getDecomposition(id).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          this.decomposition.set(res.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el detalle del despiece'
        });
        this.loading.set(false);
        this.router.navigate(['/production/decomposition']);
      }
    });
  }

  onBack(): void {
    this.router.navigate(['/production/decomposition']);
  }

  printDecomposition(): void {
    window.print();
  }

  getYieldPercentage(): number {
    const decomp = this.decomposition();
    if (!decomp || decomp.inputQuantity <= 0) return 0;
    const outputWeight = decomp.items.reduce((acc, item) => acc + item.quantity, 0);
    return (outputWeight / decomp.inputQuantity) * 100;
  }

  getProductImageUrl(imageUrl: string | null | undefined): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }
}
