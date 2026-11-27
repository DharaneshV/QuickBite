using Microsoft.EntityFrameworkCore;
using QuickBite.Api.Data;
using QuickBite.Api.DTOs.Orders;
using QuickBite.Api.Models;

namespace QuickBite.Api.Services.OrderManagement;

public class OrderManagementService
{
    private static readonly Dictionary<string, string> AllowedStatuses =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Pending"] = "Pending",
            ["Confirmed"] = "Confirmed",
            ["Preparing"] = "Preparing",
            ["Out for Delivery"] = "Out for Delivery",
            ["Delivered"] = "Delivered",
            ["Cancelled"] = "Cancelled"
        };

    private readonly AppDbContext _context;

    public OrderManagementService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<OrderResponse>> GetMyOrdersAsync(int userId)
    {
        return await BuildOrderQuery()
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => MapToResponse(o))
            .ToListAsync();
    }

    public async Task<List<OrderResponse>> GetAllOrdersAsync(string? status = null)
    {
        var query = BuildOrderQuery();

        if (!string.IsNullOrWhiteSpace(status))
        {
            var normalized = status.Trim().ToLower();
            query = query.Where(o => o.Status.ToLower() == normalized);
        }

        return await query
            .OrderByDescending(o => o.OrderDate)
            .Select(o => MapToResponse(o))
            .ToListAsync();
    }

    public async Task<OrderResponse?> GetOrderByIdAsync(
        int orderId,
        int requestingUserId,
        bool isAdmin)
    {
        var order = await BuildOrderQuery()
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order is null)
        {
            return null;
        }

        if (!isAdmin && order.UserId != requestingUserId)
        {
            throw new UnauthorizedAccessException("You do not have access to this order.");
        }

        return MapToResponse(order);
    }

    public async Task<OrderResponse?> UpdateOrderStatusAsync(int orderId, string status)
    {
        if (string.IsNullOrWhiteSpace(status) ||
            !AllowedStatuses.TryGetValue(status.Trim(), out var canonicalStatus))
        {
            var validList = string.Join(", ", AllowedStatuses.Values);
            throw new ArgumentException($"Invalid status. Allowed values: {validList}.");
        }

        var order = await _context.Orders
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order is null)
        {
            return null;
        }

        order.Status = canonicalStatus;
        await _context.SaveChangesAsync();

        return MapToResponse(order);
    }

    private IQueryable<Order> BuildOrderQuery()
    {
        return _context.Orders
            .AsNoTracking()
            .Include(o => o.User)
            .Include(o => o.OrderItems)
                .ThenInclude(i => i.Product);
    }

    private static OrderResponse MapToResponse(Order order)
    {
        return new OrderResponse
        {
            OrderId = order.OrderId,
            UserId = order.UserId,
            CustomerName = order.User?.Name ?? string.Empty,
            CustomerEmail = order.User?.Email ?? string.Empty,
            OrderDate = order.OrderDate,
            TotalAmount = order.TotalAmount,
            Status = order.Status,
            Items = order.OrderItems.Select(i => new OrderItemResponse
            {
                OrderItemId = i.OrderItemId,
                ProductId = i.ProductId,
                ProductName = i.Product?.Name ?? $"Product #{i.ProductId}",
                ImageUrl = i.Product?.ImageUrl,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                LineTotal = i.UnitPrice * i.Quantity
            }).ToList()
        };
    }
}

