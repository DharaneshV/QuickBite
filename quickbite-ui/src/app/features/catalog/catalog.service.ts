import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Brand, BrandRequest, Category, CategoryRequest } from './catalog.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly categoriesUrl = `${environment.apiUrl}/categories`;
  private readonly brandsUrl = `${environment.apiUrl}/brands`;

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl);
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.categoriesUrl}/${id}`);
  }

  createCategory(payload: CategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.categoriesUrl, payload);
  }

  updateCategory(id: number, payload: CategoryRequest): Observable<Category> {
    return this.http.put<Category>(`${this.categoriesUrl}/${id}`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${id}`);
  }

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.brandsUrl);
  }

  getBrand(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.brandsUrl}/${id}`);
  }

  createBrand(payload: BrandRequest): Observable<Brand> {
    return this.http.post<Brand>(this.brandsUrl, payload);
  }

  updateBrand(id: number, payload: BrandRequest): Observable<Brand> {
    return this.http.put<Brand>(`${this.brandsUrl}/${id}`, payload);
  }

  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.brandsUrl}/${id}`);
  }
}

