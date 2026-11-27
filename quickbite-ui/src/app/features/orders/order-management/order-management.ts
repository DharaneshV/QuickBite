import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STATUSES, Order } from '../orders.models';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-management.html',
  styleUrl: './order-management.css',
})
export class OrderManagementComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);

  readonly statuses = ORDER_STATUSES;
  readonly orders = signal<Order[]>([]);
  readonly selectedStatusFilter = signal<string>('');
  readonly searchTerm = signal<string>('');
  readonly isLoading = signal(false);
  readonly updatingOrderId = signal<number | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly filteredOrders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatusFilter();

    return this.orders().filter((o) => {
      const matchesStatus = !status || o.status === status;
      const matchesSearch =
        !term ||
        o.orderId.toString().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.customerEmail.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.ordersService.getAllOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage.set(this.extractError(err, 'Failed to load orders.'));
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  onStatusFilterChange(event: Event): void {
    this.selectedStatusFilter.set((event.target as HTMLSelectElement).value);
  }

  onStatusChange(order: Order, event: Event): void {
    const newStatus = (event.target as HTMLSelectElement).value;
    if (!newStatus || newStatus === order.status) {
      return;
    }

    this.updatingOrderId.set(order.orderId);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.ordersService
      .updateOrderStatus(order.orderId, { status: newStatus })
      .subscribe({
        next: (updated) => {
          this.orders.update((list) =>
            list.map((item) =>
              item.orderId === order.orderId ? updated : item
            )
          );
          this.successMessage.set(
            `Order #${updated.orderId} updated to "${updated.status}".`
          );
          this.updatingOrderId.set(null);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMessage.set(
            this.extractError(err, 'Failed to update order status.')
          );
          this.updatingOrderId.set(null);
        },
      });
  }

  statusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const apiMsg = err.error?.message;
    return typeof apiMsg === 'string' && apiMsg.trim() ? apiMsg : fallback;
  }
}

