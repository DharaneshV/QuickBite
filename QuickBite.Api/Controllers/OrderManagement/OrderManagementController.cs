using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickBite.Api.DTOs.Orders;
using QuickBite.Api.Services.OrderManagement;

namespace QuickBite.Api.Controllers.OrderManagement;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrderManagementController : ControllerBase
{
    private readonly OrderManagementService _orderService;

    public OrderManagementController(OrderManagementService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<OrderResponse>>> GetMyOrders()
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user identity." });
        }

        var orders = await _orderService.GetMyOrdersAsync(userId);
        return Ok(orders);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<OrderResponse>>> GetAllOrders([FromQuery] string? status)
    {
        var orders = await _orderService.GetAllOrdersAsync(status);
        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderResponse>> GetById(int id)
    {
        if (!TryGetUserId(out var userId))
        {
            return Unauthorized(new { message = "Invalid user identity." });
        }

        var isAdmin = User.IsInRole("Admin");

        try
        {
            var order = await _orderService.GetOrderByIdAsync(id, userId, isAdmin);
            if (order is null)
            {
                return NotFound(new { message = "Order not found." });
            }

            return Ok(order);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrderResponse>> UpdateStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var updated = await _orderService.UpdateOrderStatusAsync(id, request.Status);
            if (updated is null)
            {
                return NotFound(new { message = "Order not found." });
            }

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private bool TryGetUserId(out int userId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return int.TryParse(claim, out userId) && userId > 0;
    }
}

