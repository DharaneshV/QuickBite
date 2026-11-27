import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CatalogService } from '../catalog.service';
import { Category } from '../catalog.models';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class CategoriesComponent implements OnInit {
  private readonly catalogService = inject(CatalogService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);
  readonly searchTerm = signal('');
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly isModalOpen = signal(false);
  readonly editingCategoryId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.categories();
    }

    return this.categories().filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.description?.toLowerCase().includes(term) ?? false)
    );
  });

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.catalogService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err, 'Failed to load categories.'));
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

  startEdit(category: Category): void {
    this.editingCategoryId.set(category.categoryId);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.form.setValue({
      name: category.name,
      description: category.description ?? '',
    });
    this.isModalOpen.set(true);
  }

  cancelEdit(): void {
    this.isModalOpen.set(false);
    this.editingCategoryId.set(null);
    this.form.reset({ name: '', description: '' });
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
    };

    if (!payload.name) {
      this.form.controls.name.setErrors({ required: true });
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const editId = this.editingCategoryId();
    if (editId !== null) {
      this.catalogService.updateCategory(editId, payload).subscribe({
        next: (updated) => {
          this.categories.update((list) =>
            list
              .map((item) => (item.categoryId === editId ? updated : item))
              .sort((a, b) => a.name.localeCompare(b.name))
          );
          this.successMessage.set(`Category "${updated.name}" updated.`);
          this.cancelEdit();
          this.isSubmitting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(err, 'Failed to update category.'));
          this.isSubmitting.set(false);
        },
      });
    } else {
      this.catalogService.createCategory(payload).subscribe({
        next: (created) => {
          this.categories.update((list) =>
            [...list, created].sort((a, b) => a.name.localeCompare(b.name))
          );
          this.successMessage.set(`Category "${created.name}" created.`);
          this.cancelEdit();
          this.isSubmitting.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(err, 'Failed to create category.'));
          this.isSubmitting.set(false);
        },
      });
    }
  }

  deleteCategory(category: Category): void {
    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.catalogService.deleteCategory(category.categoryId).subscribe({
      next: () => {
        this.categories.update((list) =>
          list.filter((item) => item.categoryId !== category.categoryId)
        );
        if (this.editingCategoryId() === category.categoryId) {
          this.cancelEdit();
        }
        this.successMessage.set(`Category "${category.name}" deleted.`);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractErrorMessage(err, 'Failed to delete category.'));
      },
    });
  }

  private extractErrorMessage(err: HttpErrorResponse, fallback: string): string {
    const apiMessage = err.error?.message;
    return typeof apiMessage === 'string' && apiMessage.trim() ? apiMessage : fallback;
  }
}

