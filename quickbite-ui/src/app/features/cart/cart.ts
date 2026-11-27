import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../products/products.models';
import { ProductsService } from '../products/products.service';
import { CartService } from './cart.service';

@Component({
  selector: 'app-cart',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent implements OnInit {
  readonly cartService = inject(CartService);
  private readonly productsService = inject(ProductsService);

  readonly availableProducts = signal<Product[]>([]);
  readonly isLoadingCatalog = signal(false);
  readonly feedbackMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAvailableProducts();
  }

  loadAvailableProducts(): void {
    this.isLoadingCatalog.set(true);
    this.productsService.getProducts({ availableOnly: true }).subscribe({
      next: (products) => {
        this.availableProducts.set(products.filter((p) => p.stockQuantity > 0));
        this.isLoadingCatalog.set(false);
      },
      error: () => {
        this.isLoadingCatalog.set(false);
      },
    });
  }

  addToCart(product: Product): void {
    const result = this.cartService.addItem(product, 1);
    this.feedbackMessage.set(
      result.added ? `Added ${product.name} to your cart.` : (result.message ?? null)
    );
  }
}
