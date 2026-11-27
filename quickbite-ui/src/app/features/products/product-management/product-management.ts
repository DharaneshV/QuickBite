import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Brand, Category } from '../../catalog/catalog.models';
import { CatalogService } from '../../catalog/catalog.service';
import { Product } from '../products.models';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './product-management.html',
  styleUrl: './product-management.css',
})
export class ProductManagementComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly catalogService = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly searchTerm = signal('');
  readonly filterCategoryId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly isModalOpen = signal(false);
  readonly editingProductId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const catId = this.filterCategoryId();

    return this.products().filter((p) => {
      const matchesCategory = catId === null || p.categoryId === catId;
      const matchesTerm =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.categoryName.toLowerCase().includes(term) ||
        p.brandName.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    imageUrl: ['', [Validators.maxLength(500)]],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    brandId: [0, [Validators.required, Validators.min(1)]],
    packaging: ['', [Validators.maxLength(100)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    isAvailable: [true],
  });

  ngOnInit(): void {
    this.loadCatalogOptions();
    this.loadProducts();
  }

  loadCatalogOptions(): void {
    this.catalogService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
    });
    this.catalogService.getBrands().subscribe({
      next: (data) => this.brands.set(data),
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productsService.getProducts().subscribe({
      next: (data) => {
        this.products.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err, 'Failed to load products.'));
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onCategoryFilter(event: Event): void {
    const raw = (event.target as HTMLSelectElement).value;
    this.filterCategoryId.set(raw ? Number(raw) : null);
  }

  openCreateModal(): void {
    this.cancelEdit();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isModalOpen.set(true);
  }

  startEdit(product: Product): void {
    this.editingProductId.set(product.productId);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.form.setValue({
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      imageUrl: product.imageUrl ?? '',
      categoryId: product.categoryId,
      brandId: product.brandId,
      packaging: product.packaging ?? '',
      stockQuantity: product.stockQuantity,
      isAvailable: product.isAvailable,
    });
    this.isModalOpen.set(true);
  }

  cancelEdit(): void {
    this.isModalOpen.set(false);
    this.editingProductId.set(null);
    this.form.reset({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      categoryId: 0,
      brandId: 0,
      packaging: '',
      stockQuantity: 0,
      isAvailable: true,
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      price: Number(raw.price),
      imageUrl: raw.imageUrl.trim() || null,
      categoryId: Number(raw.categoryId),
      brandId: Number(raw.brandId),
      packaging: raw.packaging.trim() || null,
      stockQuantity: Number(raw.stockQuantity),
      isAvailable: raw.isAvailable,
    };

    if (!payload.name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const editId = this.editingProductId();
    if (editId === null && !payload.imageUrl) {
      const selectedCategory = this.categories().find((c) => c.categoryId === payload.categoryId);
      if (selectedCategory) {
        const catMap: Record<string, string> = {
          'bakery & breads': '/images/category/Bakery & Breads.jpg',
          'beverages': '/images/category/Beverages.jpg',
          'desserts': '/images/category/Desserts.jpg',
          'healthy bowls': '/images/category/Healthy Bowls.jpg',
          'pizzas': '/images/category/Pizzas.jpg',
          'snacks & sides': '/images/category/Snacks & Sides.jpg',
        };
        const defImg = catMap[selectedCategory.name.trim().toLowerCase()];
        if (defImg) {
          payload.imageUrl = defImg;
        }
      }
    }

    if (editId !== null) {
      this.productsService.updateProduct(editId, payload).subscribe({
        next: (updated) => {
          this.products.update((list) =>
            list
              .map((item) => (item.productId === editId ? updated : item))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
          this.successMessage.set(`Product "${updated.name}" updated.`);
          this.cancelEdit();
          this.isSubmitting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractError(err, 'Failed to update product.'));
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.productsService.createProduct(payload).subscribe({
        next: (created) => {
          this.products.update((list) =>
            [...list, created].sort((a, b) => a.name.localeCompare(b.name))
          );
          this.successMessage.set(`Product "${created.name}" created.`);
          this.cancelEdit();
          this.isSubmitting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractError(err, 'Failed to create product.'));
          this.isSubmitting.set(false);
        },
      });
    }
  }

  onStockChange(product: Product, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isNaN(value) || value < 0) {
      return;
    }

    this.productsService
      .updateStock(product.productId, { stockQuantity: value })
      .subscribe({
        next: (updated) => {
          this.products.update((list) =>
            list.map((item) =>
              item.productId === product.productId ? updated : item
            )
          );
          this.successMessage.set(`Stock updated for "${updated.name}".`);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractError(err, 'Failed to update stock.'));
        },
      });
  }

  toggleAvailability(product: Product): void {
    this.productsService
      .updateStock(product.productId, {
        stockQuantity: product.stockQuantity,
        isAvailable: !product.isAvailable,
      })
      .subscribe({
        next: (updated) => {
          this.products.update((list) =>
            list.map((item) =>
              item.productId === product.productId ? updated : item
            )
          );
          this.successMessage.set(
            `"${updated.name}" marked as ${updated.isAvailable ? 'Available' : 'Unavailable'}.`
          );
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractError(err, 'Failed to update availability.')
          );
        },
      });
  }

  deleteProduct(product: Product): void {
    if (!confirm(`Delete product "${product.name}"?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.productsService.deleteProduct(product.productId).subscribe({
      next: () => {
        this.products.update((list) =>
          list.filter((item) => item.productId !== product.productId)
        );
        if (this.editingProductId() === product.productId) {
          this.cancelEdit();
        }
        this.successMessage.set(`Product "${product.name}" deleted.`);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err, 'Failed to delete product.'));
      },
    });
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const apiMsg = err.error?.message;
    return typeof apiMsg === 'string' && apiMsg.trim() ? apiMsg : fallback;
  }
}
