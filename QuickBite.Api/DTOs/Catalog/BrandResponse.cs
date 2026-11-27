namespace QuickBite.Api.DTOs.Catalog;

public class BrandResponse
{
    public int BrandId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ProductCount { get; set; }
}

