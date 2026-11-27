export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export interface OrderItem {
  orderItemId: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  orderId: number;
  userId: number;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus | string;
  items: OrderItem[];
}

export interface UpdateOrderStatusRequest {
  status: string;
}

