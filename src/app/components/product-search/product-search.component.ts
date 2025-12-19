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
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Product } from '../../inventory/interfaces/product.interface';
//prettier-ignore
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, Subject, Subscription, switchMap, tap } from 'rxjs';
import { ProductsService } from '../../inventory/services/products.service';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-product-search',
  imports: [ReactiveFormsModule, FormsModule, FloatLabelModule, InputTextModule, ButtonModule],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.css',
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
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
        switchMap((query) => this.searchProductsApi(query))
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
    return this.productsService.searchProducts(query, this.branchId).pipe(
      map((response) => {
        if (response.statusCode === 200) {
          const products = response.data;
          // Filter out already added products
          if (this.excludedProductIds.length > 0) {
            return products.filter((product) => !this.excludedProductIds.includes(product.id));
          }
          return products;
        }
        return [];
      }),
      catchError((error) => {
        console.error('Error searching products:', error);
        return of([]);
      })
    );
  }

  onSearchProduct() {
    const query = this.searchQuery.trim();

    if (query.length < 2) {
      this.loadTopSelling();
      return;
    }

    this.showProductResults = true;
    this.searchSubject.next(query);
  }

  onFocus() {
    const query = this.searchQuery.trim();
    if (query.length < 2) {
      this.loadTopSelling();
    } else {
      this.onSearchProduct();
    }
  }

  loadTopSelling() {
    this.searchLoading = true;
    this.showProductResults = true;
    this.isTopSelling = true;
    this.productsService.getTopSelling(this.branchId).subscribe({
      next: (res) => {
        if (res.statusCode === 200) {
          let products = res.data;
          if (this.excludedProductIds.length > 0) {
            products = products.filter((product) => !this.excludedProductIds.includes(product.id));
          }
          this.filteredProducts = products;
        } else {
          this.filteredProducts = [];
        }
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
}
