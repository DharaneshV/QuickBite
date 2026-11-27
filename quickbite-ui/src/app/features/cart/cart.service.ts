import { computed, Injectable, signal } from '@angular/core';
import { Product } from '../products/products.models';

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stockQuantity: number;
  quantity: number;
}

export type CartProduct = Pick<
  Product,
  'productId' | 'name' | 'price' | 'imageUrl' | 'stockQuantity' | 'isAvailable'
>;

const CART_STORAGE_KEY = 'quickbite_cart_items';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>(this.readStoredItems());

  readonly items = this.itemsSignal.asReadonly();
  readonly itemCount = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.quantity, 0)
  );
  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((total, item) => total + item.price * item.quantity, 0)
  );
  readonly isEmpty = computed(() => this.itemsSignal().length === 0);

  addItem(product: CartProduct, quantity = 1): { added: boolean; message?: string } {
    if (!product.isAvailable || product.stockQuantity <= 0) {
      return { added: false, message: `${product.name} is currently out of stock.` };
    }

    const requested = Math.max(1, Math.floor(quantity));
    const current = this.itemsSignal();
    const existing = current.find((item) => item.productId === product.productId);

    if (existing) {
      const nextQuantity = Math.min(product.stockQuantity, existing.quantity + requested);
      if (nextQuantity === existing.quantity) {
        return {
          added: false,
          message: `Maximum available stock (${product.stockQuantity}) reached for ${product.name}.`,
        };
      }

      this.setItems(
        current.map((item) =>
          item.productId === product.productId
            ? {
                ...item,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrl,
                stockQuantity: product.stockQuantity,
                quantity: nextQuantity,
              }
            : item
        )
      );

      return { added: true };
    }

    const initialQuantity = Math.min(product.stockQuantity, requested);
    this.setItems([
      ...current,
      {
        productId: product.productId,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stockQuantity: product.stockQuantity,
        quantity: initialQuantity,
      },
    ]);

    return { added: true };
  }

  updateQuantity(productId: number, quantity: number): void {
    const normalized = Math.floor(quantity);
    if (normalized <= 0) {
      this.removeItem(productId);
      return;
    }

    this.setItems(
      this.itemsSignal().map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(item.stockQuantity, normalized) }
          : item
      )
    );
  }

  increment(productId: number): void {
    const target = this.itemsSignal().find((item) => item.productId === productId);
    if (target && target.quantity < target.stockQuantity) {
      this.updateQuantity(productId, target.quantity + 1);
    }
  }

  decrement(productId: number): void {
    const target = this.itemsSignal().find((item) => item.productId === productId);
    if (target) {
      this.updateQuantity(productId, target.quantity - 1);
    }
  }

  removeItem(productId: number): void {
    this.setItems(this.itemsSignal().filter((item) => item.productId !== productId));
  }

  clearCart(): void {
    this.setItems([]);
  }

  private setItems(items: CartItem[]): void {
    this.itemsSignal.set(items);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }

  private readStoredItems(): CartItem[] {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.filter(
        (item): item is CartItem =>
          typeof item?.productId === 'number' &&
          typeof item?.name === 'string' &&
          typeof item?.price === 'number' &&
          typeof item?.stockQuantity === 'number' &&
          typeof item?.quantity === 'number' &&
          item.quantity > 0
      );
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  }
}
