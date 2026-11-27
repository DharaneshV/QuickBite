export interface Product {
  productId: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  categoryId: number;
  categoryName: string;
  brandId: number;
  brandName: string;
  packaging: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  createdAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  categoryId: number;
  brandId: number;
  packaging?: string | null;
  stockQuantity: number;
  isAvailable: boolean;
}

export interface UpdateProductStockRequest {
  stockQuantity: number;
  isAvailable?: boolean;
}

export interface ProductFilter {
  search?: string;
  categoryId?: number | null;
  brandId?: number | null;
  availableOnly?: boolean;
}

