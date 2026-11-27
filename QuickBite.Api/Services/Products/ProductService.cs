using Microsoft.EntityFrameworkCore;
using QuickBite.Api.Data;
using QuickBite.Api.DTOs.Products;
using QuickBite.Api.Models;

namespace QuickBite.Api.Services.Products;

public class ProductService
{
    private readonly AppDbContext _context;

    public ProductService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProductResponse>> GetAllAsync(
        string? search = null,
        int? categoryId = null,
        int? brandId = null,
        bool? availableOnly = null)
    {
        var query = _context.Products.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                (p.Description != null && p.Description.ToLower().Contains(term)) ||
                (p.Packaging != null && p.Packaging.ToLower().Contains(term)));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (brandId.HasValue)
        {
            query = query.Where(p => p.BrandId == brandId.Value);
        }

        if (availableOnly == true)
        {
            query = query.Where(p => p.IsAvailable && p.StockQuantity > 0);
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => new ProductResponse
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                BrandId = p.BrandId,
                BrandName = p.Brand.Name,
                Packaging = p.Packaging,
                StockQuantity = p.StockQuantity,
                IsAvailable = p.IsAvailable,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ProductResponse?> GetByIdAsync(int id)
    {
        return await _context.Products
            .AsNoTracking()
            .Where(p => p.ProductId == id)
            .Select(p => new ProductResponse
            {
                ProductId = p.ProductId,
                Name = p.Name,
                Description = p.Description,
                Price = p.Price,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                BrandId = p.BrandId,
                BrandName = p.Brand.Name,
                Packaging = p.Packaging,
                StockQuantity = p.StockQuantity,
                IsAvailable = p.IsAvailable,
                CreatedAt = p.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ProductResponse> CreateAsync(ProductRequest request)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Product name is required.");
        }

        await ValidateForeignKeysAsync(request.CategoryId, request.BrandId);

        var product = new Product
        {
            Name = name,
            Description = NormalizeOptional(request.Description),
            Price = request.Price,
            ImageUrl = NormalizeOptional(request.ImageUrl),
            CategoryId = request.CategoryId,
            BrandId = request.BrandId,
            Packaging = NormalizeOptional(request.Packaging),
            StockQuantity = request.StockQuantity,
            IsAvailable = request.IsAvailable,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(product.ProductId))!;
    }

    public async Task<ProductResponse?> UpdateAsync(int id, ProductRequest request)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == id);
        if (product is null)
        {
            return null;
        }

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Product name is required.");
        }

        await ValidateForeignKeysAsync(request.CategoryId, request.BrandId);

        product.Name = name;
        product.Description = NormalizeOptional(request.Description);
        product.Price = request.Price;
        product.ImageUrl = NormalizeOptional(request.ImageUrl);
        product.CategoryId = request.CategoryId;
        product.BrandId = request.BrandId;
        product.Packaging = NormalizeOptional(request.Packaging);
        product.StockQuantity = request.StockQuantity;
        product.IsAvailable = request.IsAvailable;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(product.ProductId);
    }

    public async Task<ProductResponse?> UpdateStockAsync(int id, int stockQuantity, bool? isAvailable)
    {
        if (stockQuantity < 0)
        {
            throw new ArgumentException("Stock quantity cannot be negative.");
        }

        var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == id);
        if (product is null)
        {
            return null;
        }

        product.StockQuantity = stockQuantity;
        if (isAvailable.HasValue)
        {
            product.IsAvailable = isAvailable.Value;
        }

        await _context.SaveChangesAsync();
        return await GetByIdAsync(product.ProductId);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == id);
        if (product is null)
        {
            return false;
        }

        var hasOrderItems = await _context.OrderItems.AnyAsync(i => i.ProductId == id);
        if (hasOrderItems)
        {
            throw new InvalidOperationException(
                "Cannot delete product because it is referenced by existing orders.");
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task ValidateForeignKeysAsync(int categoryId, int brandId)
    {
        var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryId == categoryId);
        if (!categoryExists)
        {
            throw new ArgumentException($"Category with ID {categoryId} does not exist.");
        }

        var brandExists = await _context.Brands.AnyAsync(b => b.BrandId == brandId);
        if (!brandExists)
        {
            throw new ArgumentException($"Brand with ID {brandId} does not exist.");
        }
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}

