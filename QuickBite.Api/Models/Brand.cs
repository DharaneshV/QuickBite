namespace QuickBite.Api.Models;

public class Brand
{
    public int BrandId { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
