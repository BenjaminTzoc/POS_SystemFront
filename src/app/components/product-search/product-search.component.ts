//prettier-ignore
import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
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
})
export class ProductSearchComponent implements OnInit, OnDestroy {
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  searchQuery: string = '';
  searchLoading: boolean = false;
  filteredProducts: Product[] = [];
  showProductResults: boolean = false;

  @Output() productSelected = new EventEmitter<Product>();

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

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  setupSearchDebounce(): void {
    this.searchSubscription = this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => (this.searchLoading = true)),
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
    return this.productsService.searchProducts(query).pipe(
      map((response) => {
        console.log(response);
        if (response.statusCode === 200) {
          return response.data;
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
      this.filteredProducts = [];
      this.showProductResults = false;
      return;
    }

    this.showProductResults = true;
    this.searchSubject.next(query);
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
