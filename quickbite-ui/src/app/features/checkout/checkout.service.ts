import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CheckoutItemRequest {
  productId: number;
  quantity: number;
}

export interface CreateOrderRequest {
  items: CheckoutItemRequest[];
}

export interface CheckoutOrderItemResponse {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CheckoutResponse {
  orderId: number;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: CheckoutOrderItemResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/checkout`;

  placeOrder(items: CheckoutItemRequest[]): Observable<CheckoutResponse> {
    const payload: CreateOrderRequest = { items };
    return this.http.post<CheckoutResponse>(this.apiUrl, payload);
  }
}
