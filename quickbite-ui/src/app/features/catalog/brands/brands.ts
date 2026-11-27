import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogService } from '../catalog.service';
import { Brand } from '../catalog.models';

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './brands.html',
  styleUrl: './brands.css',
})
export class BrandsComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  readonly brands = signal<Brand[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly isModalOpen = signal(false);
  readonly editingBrandId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly filteredBrands = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.brands();
    }

    return this.brands().filter((b) => b.name.toLowerCase().includes(term));
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
  });

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.catalogService.getBrands().subscribe({
      next: (data) => {
        this.brands.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err, 'Failed to load brands.'));
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  openCreateModal(): void {
    this.cancelEdit();
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.isModalOpen.set(true);
  }

  startEdit(brand: Brand): void {
    this.editingBrandId.set(brand.brandId);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.form.setValue({ name: brand.name });
    this.isModalOpen.set(true);
  }

  cancelEdit(): void {
    this.isModalOpen.set(false);
    this.editingBrandId.set(null);
    this.form.reset({ name: '' });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.getRawValue().name.trim();
    if (!name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const editId = this.editingBrandId();
    if (editId !== null) {
      this.catalogService.updateBrand(editId, { name }).subscribe({
        next: (updated) => {
          this.brands.update((list) =>
            list
              .map((item) => (item.brandId === editId ? updated : item))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
          this.successMessage.set(`Brand "${updated.name}" updated.`);
          this.cancelEdit();
          this.isSubmitting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(err, 'Failed to update brand.'));
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.catalogService.createBrand({ name }).subscribe({
        next: (created) => {
          this.brands.update((list) =>
            [...list, created].sort((a, b) => a.name.localeCompare(b.name))
          );
          this.successMessage.set(`Brand "${created.name}" created.`);
          this.cancelEdit();
          this.isSubmitting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(err, 'Failed to create brand.'));
          this.isSubmitting.set(false);
        },
      });
    }
  }

  deleteBrand(brand: Brand): void {
    if (!confirm(`Delete brand "${brand.name}"?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.catalogService.deleteBrand(brand.brandId).subscribe({
      next: () => {
        this.brands.update((list) =>
          list.filter((item) => item.brandId !== brand.brandId)
        );
        if (this.editingBrandId() === brand.brandId) {
          this.cancelEdit();
        }
        this.successMessage.set(`Brand "${brand.name}" deleted.`);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err, 'Failed to delete brand.'));
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
    const apiMessage = err.error?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : fallback;
  }
}

