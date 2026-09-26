import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Product } from '../../inventory/interfaces/product.interface';
//prettier-ignore
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, Subject, Subscription, switchMap, tap } from 'rxjs';
import { ProductsService } from '../../inventory/services/products.service';
import { ButtonModule } from 'primeng/button';
import { ApiResponse } from '../../core/models/api-response.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-search',
  imports: [CommonModule, CurrencyPipe, ReactiveFormsModule, FormsModule, FloatLabelModule, InputTextModule, ButtonModule],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(var(--search-enter-y, -10px))' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(var(--search-enter-y, -10px))' })),
      ]),
    ]),
  ],
})
export class ProductSearchComponent implements OnInit, OnDestroy, OnChanges {
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  searchQuery: string = '';
  searchLoading: boolean = false;
  filteredProducts: Product[] = [];
  showProductResults: boolean = false;
  isTopSelling: boolean = false;

  @Output() productSelected = new EventEmitter<Product>();
  @Input() branchId?: string;
  @Input() excludedProductIds: string[] = [];
  @Input() disabled: boolean = false;
  /** Muestra los resultados encima del campo en lugar de debajo. */
  @Input() openUpward: boolean = false;
  /** Catálogo completo (sin sucursal ni más vendidos). */
  @Input() catalogMode: boolean = false;

  constructor(private readonly productsService: ProductsService) {}

  @ViewChild('searchContainer') searchContainer!: ElementRef;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.searchContainer && !this.searchContainer.nativeElement.contains(event.target)) {
      this.showProductResults = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showProductResults) {
      switch (event.key) {
        case 'Escape':
          this.showProductResults = false;
          event.preventDefault();
          break;
      }
    }
  }

  ngOnInit(): void {
    this.setupSearchDebounce();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['branchId'] && !changes['branchId'].firstChange) {
      this.searchQuery = '';
      this.filteredProducts = [];
      this.showProductResults = false;
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        tap(() => {
          this.searchLoading = true;
          this.isTopSelling = false;
        }),
        switchMap((query) => this.searchProductsApi(query)),
      )
      .subscribe({
        next: (products) => {
          this.filteredProducts = products;
          this.searchLoading = false;
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.filteredProducts = [];
          this.searchLoading = false;
        },
      });
  }

  searchProductsApi(query: string): Observable<Product[]> {
    const request = this.catalogMode
      ? this.productsService.searchProducts(query, undefined, false, undefined, undefined, undefined, undefined, true)
      : this.productsService.searchProducts(query, this.branchId);

    return request.pipe(
      map((response) => {
        if (response.statusCode === 200) {
          return this.applyExclusions(response.data);
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error searching products:', error);
        return of([]);
      }),
    );
  }

  onSearchProduct() {
    const query = this.searchQuery.trim();

    if (query.length < 2) {
      this.loadInitialResults();
      return;
    }

    this.showProductResults = true;
    this.searchSubject.next(query);
  }

  onFocus() {
    const query = this.searchQuery.trim();
    if (query.length < 2) {
      this.loadInitialResults();
    } else {
      this.onSearchProduct();
    }
  }

  loadInitialResults() {
    if (this.catalogMode) {
      this.loadCatalog();
      return;
    }
    this.loadTopSelling();
  }

  loadCatalog() {
    this.searchLoading = true;
    this.showProductResults = true;
    this.isTopSelling = false;
    this.productsService.getProducts(undefined, false, undefined, undefined, undefined, undefined, undefined, true).subscribe({
      next: (res: ApiResponse<Product[]>) => {
        this.filteredProducts = res.statusCode === 200 ? this.applyExclusions(res.data) : [];
        this.searchLoading = false;
      },
      error: (err) => {
        console.error('Error loading catalog products', err);
        this.filteredProducts = [];
        this.searchLoading = false;
      },
    });
  }

  loadTopSelling() {
    this.searchLoading = true;
    this.showProductResults = true;
    this.isTopSelling = true;
    this.productsService.getTopSelling(this.branchId).subscribe({
      next: (res: ApiResponse<Product[]>) => {
        this.filteredProducts = res.statusCode === 200 ? this.applyExclusions(res.data) : [];
        this.searchLoading = false;
      },
      error: (err) => {
        console.error('Error loading top selling products', err);
        this.filteredProducts = [];
        this.searchLoading = false;
      },
    });
  }

  onCreateNewProduct(): void {
    console.log('CREAR NUEVO PRODUCTO');
  }

  selectProduct(product: Product) {
    this.productSelected.emit(product);
    this.showProductResults = false;
    this.searchQuery = '';
  }

  getProductImageUrl(imageUrl?: string | null): string {
    if (!imageUrl) return `${environment.baseUrl}/uploads/products/default-product.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${environment.baseUrl}${imageUrl}`;
  }

  private applyExclusions(products: Product[]): Product[] {
    const list = products ?? [];
    if (this.excludedProductIds.length === 0) return list;
    return list.filter((product) => !this.excludedProductIds.includes(product.id));
  }
}
