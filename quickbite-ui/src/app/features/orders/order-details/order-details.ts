import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Order } from '../orders.models';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);

  readonly order = signal<Order | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!idParam || Number.isNaN(id) || id <= 0) {
      this.errorMessage.set('Invalid order ID.');
      this.isLoading.set(false);
      return;
    }

    this.ordersService.getOrderById(id).subscribe({
      next: (data) => {
        this.order.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const apiMsg = err.error?.message;
        this.errorMessage.set(
          typeof apiMsg === 'string' && apiMsg.trim()
            ? apiMsg
            : 'Unable to load order details.'
        );
        this.isLoading.set(false);
      },
    });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}

