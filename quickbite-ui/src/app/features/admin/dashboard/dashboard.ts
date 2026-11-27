import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Category } from '../../catalog/catalog.models';
import { CatalogService } from '../../catalog/catalog.service';
import { Order } from '../../orders/orders.models';
import { OrdersService } from '../../orders/orders.service';
import { Product } from '../../products/products.models';
import { ProductsService } from '../../products/products.service';

const LOW_STOCK_THRESHOLD = 10;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly catalogService = inject(CatalogService);
  private readonly ordersService = inject(OrdersService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly totalProducts = computed(() => this.products().length);
  readonly totalCategories = computed(() => this.categories().length);
  readonly totalOrders = computed(() => this.orders().length);
  readonly pendingOrdersCount = computed(
    () => this.orders().filter((o) => o.status === 'Pending').length
  );

  readonly lowStockProducts = computed(() =>
    this.products()
      .filter((p) => p.stockQuantity <= LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stockQuantity - b.stockQuantity)
  );

  readonly recentOrders = computed(() => this.orders().slice(0, 5));

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      products: this.productsService.getProducts(),
      categories: this.catalogService.getCategories(),
      orders: this.ordersService.getAllOrders(),
    }).subscribe({
      next: ({ products, categories, orders }) => {
        this.products.set(products);
        this.categories.set(categories);
        this.orders.set(orders);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const apiMsg = err.error?.message;
        this.errorMessage.set(
          typeof apiMsg === 'string' && apiMsg.trim()
            ? apiMsg
            : 'Failed to load dashboard metrics.'
        );
        this.isLoading.set(false);
      },
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}

