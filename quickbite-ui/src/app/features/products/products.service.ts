import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Product,
  ProductFilter,
  ProductRequest,
  UpdateProductStockRequest,
} from './products.models';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  getProducts(filter?: ProductFilter): Observable<Product[]> {
    let params = new HttpParams();

    if (filter?.search?.trim()) {
      params = params.set('search', filter.search.trim());
    }
    if (filter?.categoryId != null) {
      params = params.set('categoryId', filter.categoryId.toString());
    }
    if (filter?.brandId != null) {
      params = params.set('brandId', filter.brandId.toString());
    }
    if (filter?.availableOnly) {
      params = params.set('availableOnly', 'true');
    }

    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(payload: ProductRequest): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, payload);
  }

  updateProduct(id: number, payload: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, payload);
  }

  updateStock(id: number, payload: UpdateProductStockRequest): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/stock`, payload);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

