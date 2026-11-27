using Microsoft.EntityFrameworkCore;
using QuickBite.Api.Data;
using QuickBite.Api.DTOs.Catalog;
using QuickBite.Api.Models;

namespace QuickBite.Api.Services.Catalog;

public class CategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryResponse>> GetAllAsync()
    {
        return await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                ProductCount = c.Products.Count
            })
            .ToListAsync();
    }

    public async Task<CategoryResponse?> GetByIdAsync(int id)
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(c => c.CategoryId == id)
            .Select(c => new CategoryResponse
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Description = c.Description,
                ProductCount = c.Products.Count
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CategoryResponse> CreateAsync(CategoryRequest request)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Category name is required.");
        }

        var normalized = name.ToLower();
        var exists = await _context.Categories
            .AnyAsync(c => c.Name.ToLower() == normalized);

        if (exists)
        {
            throw new InvalidOperationException($"Category '{name}' already exists.");
        }

        var category = new Category
        {
            Name = name,
            Description = string.IsNullOrWhiteSpace(request.Description)
                ? null
                : request.Description.Trim()
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            Description = category.Description,
            ProductCount = 0
        };
    }

    public async Task<CategoryResponse?> UpdateAsync(int id, CategoryRequest request)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.CategoryId == id);

        if (category is null)
        {
            return null;
        }

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Category name is required.");
        }

        var normalized = name.ToLower();
        var duplicateExists = await _context.Categories
            .AnyAsync(c => c.CategoryId != id && c.Name.ToLower() == normalized);

        if (duplicateExists)
        {
            throw new InvalidOperationException($"Category '{name}' already exists.");
        }

        category.Name = name;
        category.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();

        await _context.SaveChangesAsync();

        return new CategoryResponse
        {
            CategoryId = category.CategoryId,
            Name = category.Name,
            Description = category.Description,
            ProductCount = category.Products.Count
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.CategoryId == id);

        if (category is null)
        {
            return false;
        }

        var hasProducts = await _context.Products
            .AnyAsync(p => p.CategoryId == id);

        if (hasProducts)
        {
            throw new InvalidOperationException(
                "Cannot delete category because one or more products are assigned to it.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }
}

