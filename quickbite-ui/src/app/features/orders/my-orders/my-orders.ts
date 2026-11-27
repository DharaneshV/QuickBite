import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Order } from '../orders.models';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrdersComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);

  readonly orders = signal<Order[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.ordersService.getMyOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const apiMsg = err.error?.message;
        this.errorMessage.set(
          typeof apiMsg === 'string' && apiMsg.trim()
            ? apiMsg
            : 'Failed to load your orders.'
        );
        this.isLoading.set(false);
      },
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}

