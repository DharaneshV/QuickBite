export interface Category {
  categoryId: number;
  name: string;
  description: string | null;
  productCount: number;
}

export interface CategoryRequest {
  name: string;
  description?: string | null;
}

export interface Brand {
  brandId: number;
  name: string;
  productCount: number;
}

export interface BrandRequest {
  name: string;
}

