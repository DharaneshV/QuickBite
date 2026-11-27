import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../cart/cart.service';
import { Product } from '../products.models';
import { ProductsService } from '../products.service';
import { getProductImageUrl } from '../product-image.util';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);

  readonly product = signal<Product | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly cartMessage = signal<string | null>(null);

  readonly getProductImageUrl = getProductImageUrl;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id) || id <= 0) {
      this.errorMessage.set('Invalid product ID.');
      this.isLoading.set(false);
      return;
    }

    this.productsService.getProduct(id).subscribe({
      next: (data) => {
        this.product.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const apiMsg = err.error?.message;
        this.errorMessage.set(
          typeof apiMsg === 'string' && apiMsg.trim()
            ? apiMsg
            : 'Product not found.'
        );
        this.isLoading.set(false);
      },
    });
  }

  addToCart(product: Product): void {
    const res = this.cartService.addItem(product, 1);
    this.cartMessage.set(
      res.added ? `Added "${product.name}" to cart.` : (res.message ?? null)
    );
  }
}

