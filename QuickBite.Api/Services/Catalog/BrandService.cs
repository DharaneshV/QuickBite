using Microsoft.EntityFrameworkCore;
using QuickBite.Api.Data;
using QuickBite.Api.DTOs.Catalog;
using QuickBite.Api.Models;

namespace QuickBite.Api.Services.Catalog;

public class BrandService
{
    private readonly AppDbContext _context;

    public BrandService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<BrandResponse>> GetAllAsync()
    {
        return await _context.Brands
            .AsNoTracking()
            .OrderBy(b => b.Name)
            .Select(b => new BrandResponse
            {
                BrandId = b.BrandId,
                Name = b.Name,
                ProductCount = b.Products.Count
            })
            .ToListAsync();
    }

    public async Task<BrandResponse?> GetByIdAsync(int id)
    {
        return await _context.Brands
            .AsNoTracking()
            .Where(b => b.BrandId == id)
            .Select(b => new BrandResponse
            {
                BrandId = b.BrandId,
                Name = b.Name,
                ProductCount = b.Products.Count
            })
            .FirstOrDefaultAsync();
    }

    public async Task<BrandResponse> CreateAsync(BrandRequest request)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Brand name is required.");
        }

        var normalized = name.ToLower();
        var exists = await _context.Brands
            .AnyAsync(b => b.Name.ToLower() == normalized);

        if (exists)
        {
            throw new InvalidOperationException($"Brand '{name}' already exists.");
        }

        var brand = new Brand
        {
            Name = name
        };

        _context.Brands.Add(brand);
        await _context.SaveChangesAsync();

        return new BrandResponse
        {
            BrandId = brand.BrandId,
            Name = brand.Name,
            ProductCount = 0
        };
    }

    public async Task<BrandResponse?> UpdateAsync(int id, BrandRequest request)
    {
        var brand = await _context.Brands
            .Include(b => b.Products)
            .FirstOrDefaultAsync(b => b.BrandId == id);

        if (brand is null)
        {
            return null;
        }

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Brand name is required.");
        }

        var normalized = name.ToLower();
        var duplicateExists = await _context.Brands
            .AnyAsync(b => b.BrandId != id && b.Name.ToLower() == normalized);

        if (duplicateExists)
        {
            throw new InvalidOperationException($"Brand '{name}' already exists.");
        }

        brand.Name = name;
        await _context.SaveChangesAsync();

        return new BrandResponse
        {
            BrandId = brand.BrandId,
            Name = brand.Name,
            ProductCount = brand.Products.Count
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var brand = await _context.Brands
            .FirstOrDefaultAsync(b => b.BrandId == id);

        if (brand is null)
        {
            return false;
        }

        var hasProducts = await _context.Products
            .AnyAsync(p => p.BrandId == id);

        if (hasProducts)
        {
            throw new InvalidOperationException(
                "Cannot delete brand because one or more products are assigned to it.");
        }

        _context.Brands.Remove(brand);
        await _context.SaveChangesAsync();
        return true;
    }
}

