import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartService } from '../cart/cart.service';
import { CheckoutResponse, CheckoutService } from './checkout.service';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly orderConfirmation = signal<CheckoutResponse | null>(null);

  placeOrder(): void {
    const items = this.cartService.items().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    if (items.length === 0) {
      this.errorMessage.set('Your cart is empty. Add items before checking out.');
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.checkoutService
      .placeOrder(items)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          this.orderConfirmation.set(response);
          this.cartService.clearCart();
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse) {
            const serverMsg = (err.error as { message?: string } | null)?.message;
            this.errorMessage.set(
              serverMsg ?? 'Unable to complete checkout. Please check your cart items.'
            );
            return;
          }
          this.errorMessage.set('Checkout failed. Please try again.');
        },
      });
  }
}
