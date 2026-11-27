using System.ComponentModel.DataAnnotations;

namespace QuickBite.Api.DTOs.Orders;

public class UpdateOrderStatusRequest
{
    [Required(ErrorMessage = "Order status is required.")]
    [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
    public string Status { get; set; } = string.Empty;
}

