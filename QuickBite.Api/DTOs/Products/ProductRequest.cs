using System.ComponentModel.DataAnnotations;

namespace QuickBite.Api.DTOs.Products;

public class ProductRequest
{
    [Required(ErrorMessage = "Product name is required.")]
    [StringLength(150, ErrorMessage = "Product name cannot exceed 150 characters.")]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters.")]
    public string? Description { get; set; }

    [Range(0.01, 999999.99, ErrorMessage = "Price must be greater than zero.")]
    public decimal Price { get; set; }

    [StringLength(500, ErrorMessage = "Image URL cannot exceed 500 characters.")]
    public string? ImageUrl { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "A valid category is required.")]
    public int CategoryId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "A valid brand is required.")]
    public int BrandId { get; set; }

    [StringLength(100, ErrorMessage = "Packaging cannot exceed 100 characters.")]
    public string? Packaging { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative.")]
    public int StockQuantity { get; set; }

    public bool IsAvailable { get; set; } = true;
}

public class UpdateProductStockRequest
{
    [Range(0, int.MaxValue, ErrorMessage = "Stock quantity cannot be negative.")]
    public int StockQuantity { get; set; }

    public bool? IsAvailable { get; set; }
}

