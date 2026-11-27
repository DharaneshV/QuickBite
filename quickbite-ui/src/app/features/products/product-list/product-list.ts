import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../catalog/catalog.models';
import { CatalogService } from '../../catalog/catalog.service';
import { CartService } from '../../cart/cart.service';
import { Product } from '../products.models';
import { ProductsService } from '../products.service';
import { getProductImageUrl } from '../product-image.util';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductListComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly catalogService = inject(CatalogService);
  private readonly cartService = inject(CartService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCategoryId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly cartMessage = signal<string | null>(null);

  readonly getProductImageUrl = getProductImageUrl;

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.catalogService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => {
        // Non-blocking: product list still works without category filter options.
      },
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productsService
      .getProducts({
        search: this.searchTerm(),
        categoryId: this.selectedCategoryId(),
      })
      .subscribe({
        next: (data) => {
          this.products.set(data);
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          const apiMsg = err.error?.message;
          this.errorMessage.set(
            typeof apiMsg === 'string' && apiMsg.trim()
              ? apiMsg
              : 'Failed to load products.'
          );
          this.isLoading.set(false);
        },
      });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
    this.loadProducts();
  }

  onCategoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = select.value ? Number(select.value) : null;
    this.selectedCategoryId.set(value);
    this.loadProducts();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCategoryId.set(null);
    this.loadProducts();
  }

  addToCart(product: Product): void {
    const res = this.cartService.addItem(product, 1);
    this.cartMessage.set(
      res.added ? `Added "${product.name}" to cart.` : (res.message ?? null)
    );
  }
}
