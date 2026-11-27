import { TestBed } from '@angular/core/testing';
import { CartProduct, CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  const burger: CartProduct = {
    productId: 1,
    name: 'Classic Burger',
    price: 8.5,
    imageUrl: null,
    stockQuantity: 3,
    isAvailable: true,
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('adds items and calculates subtotal and itemCount', () => {
    const res = service.addItem(burger, 2);
    expect(res.added).toBe(true);
    expect(service.itemCount()).toBe(2);
    expect(service.subtotal()).toBe(17);
  });

  it('caps quantities at stockQuantity and removes on zero', () => {
    service.addItem(burger, 2);
    service.increment(1);
    service.increment(1);
    expect(service.items()[0]?.quantity).toBe(3);

    service.decrement(1);
    expect(service.items()[0]?.quantity).toBe(2);

    service.updateQuantity(1, 0);
    expect(service.isEmpty()).toBe(true);
  });
});
