import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { CheckoutResponse, CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CheckoutService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts order items to /api/checkout', () => {
    const mockResponse: CheckoutResponse = {
      orderId: 42,
      orderDate: '2026-11-27T06:00:00Z',
      totalAmount: 21,
      status: 'Pending',
      items: [
        { productId: 1, productName: 'Classic Burger', quantity: 2, unitPrice: 8.5, lineTotal: 17 },
        { productId: 3, productName: 'Iced Tea', quantity: 1, unitPrice: 4, lineTotal: 4 },
      ],
    };

    service
      .placeOrder([
        { productId: 1, quantity: 2 },
        { productId: 3, quantity: 1 },
      ])
      .subscribe((res) => {
        expect(res.orderId).toBe(42);
        expect(res.totalAmount).toBe(21);
      });

    const req = httpMock.expectOne(`${environment.apiUrl}/checkout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      items: [
        { productId: 1, quantity: 2 },
        { productId: 3, quantity: 1 },
      ],
    });
    req.flush(mockResponse);
  });
});
