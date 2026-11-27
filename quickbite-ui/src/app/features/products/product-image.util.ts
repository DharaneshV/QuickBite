const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'bakery & breads': '/images/category/Bakery & Breads.jpg',
  'beverages': '/images/category/Beverages.jpg',
  'desserts': '/images/category/Desserts.jpg',
  'healthy bowls': '/images/category/Healthy Bowls.jpg',
  'pizzas': '/images/category/Pizzas.jpg',
  'snacks & sides': '/images/category/Snacks & Sides.jpg',
};

/**
 * Returns the product image URL if defined, otherwise falls back to the common
 * category image under `/images/category/`.
 */
export function getProductImageUrl(
  imageUrl: string | null | undefined,
  categoryName?: string | null
): string | null {
  if (imageUrl && imageUrl.trim()) {
    return imageUrl.trim();
  }
  if (!categoryName) {
    return null;
  }
  const key = categoryName.trim().toLowerCase();
  return CATEGORY_IMAGE_MAP[key] ?? null;
}
