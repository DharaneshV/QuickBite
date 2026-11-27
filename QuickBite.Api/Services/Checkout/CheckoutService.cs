using Microsoft.EntityFrameworkCore;
using QuickBite.Api.Data;
using QuickBite.Api.DTOs.Checkout;
using QuickBite.Api.Models;

namespace QuickBite.Api.Services.Checkout;

public class CheckoutService
{
    private readonly AppDbContext _dbContext;

    public CheckoutService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CheckoutResponse> CreateOrderAsync(int userId, CreateOrderRequest request)
    {
        if (request.Items is null || request.Items.Count == 0)
        {
            throw new ArgumentException("Order must contain at least one item.");
        }

        var userExists = await _dbContext.Users.AnyAsync(u => u.UserId == userId);
        if (!userExists)
        {
            throw new KeyNotFoundException("Authenticated user was not found.");
        }

        var consolidatedItems = request.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToList();

        if (consolidatedItems.Any(i => i.ProductId <= 0 || i.Quantity <= 0))
        {
            throw new ArgumentException("Each order item must have a valid product and positive quantity.");
        }

        var productIds = consolidatedItems.Select(i => i.ProductId).ToList();

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var productsById = await _dbContext.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.ProductId))
            .ToDictionaryAsync(p => p.ProductId);

        var orderItems = new List<OrderItem>();
        var responseItems = new List<CheckoutOrderItemResponse>();
        decimal totalAmount = 0m;

        foreach (var item in consolidatedItems)
        {
            if (!productsById.TryGetValue(item.ProductId, out var product))
            {
                throw new KeyNotFoundException($"Product with ID {item.ProductId} was not found.");
            }

            if (!product.IsAvailable)
            {
                throw new InvalidOperationException($"'{product.Name}' is currently unavailable.");
            }

            if (product.StockQuantity < item.Quantity)
            {
                throw new InvalidOperationException(
                    $"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}, requested: {item.Quantity}.");
            }

            // Deduct stock atomically so concurrent checkouts cannot oversell.
            var updatedRows = await _dbContext.Products
                .Where(p => p.ProductId == item.ProductId && p.IsAvailable && p.StockQuantity >= item.Quantity)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(p => p.StockQuantity, p => p.StockQuantity - item.Quantity));

            if (updatedRows != 1)
            {
                throw new InvalidOperationException(
                    $"Insufficient stock for '{product.Name}'. Please refresh your cart and try again.");
            }

            var lineTotal = product.Price * item.Quantity;
            totalAmount += lineTotal;

            orderItems.Add(new OrderItem
            {
                ProductId = product.ProductId,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });

            responseItems.Add(new CheckoutOrderItemResponse
            {
                ProductId = product.ProductId,
                ProductName = product.Name,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                LineTotal = lineTotal
            });
        }

        var order = new Order
        {
            UserId = userId,
            OrderDate = DateTime.UtcNow,
            TotalAmount = totalAmount,
            Status = "Pending",
            OrderItems = orderItems
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();

        return new CheckoutResponse
        {
            OrderId = order.OrderId,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            Items = responseItems
        };
    }
}
