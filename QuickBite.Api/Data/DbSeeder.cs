using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickBite.Api.Models;

namespace QuickBite.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<AppDbContext>();
        await context.Database.MigrateAsync();

        var passwordHasher = new PasswordHasher<User>();

        await SeedUsersAsync(context, passwordHasher);
        await SeedCategoriesAsync(context);
        await SeedBrandsAsync(context);
        await SeedProductsAsync(context);
        await SeedOrdersAsync(context);
    }

    private static async Task SeedUsersAsync(
        AppDbContext context,
        PasswordHasher<User> hasher)
    {
        const string adminName = "QuickBite Admin";
        const string adminEmail = "admin@quickbite.com";
        const string adminPassword = "Admin123!";

        var seedUsers = new (string Name, string Email, string Password, string Role)[]
        {
            (adminName, adminEmail, adminPassword, "Admin"),
            ("Alex Morgan", "alex@quickbite.com", "Customer123!", "Customer"),
            ("Priya Nair", "priya@quickbite.com", "Customer123!", "Customer"),
        };

        var added = false;
        foreach (var entry in seedUsers)
        {
            var exists = await context.Users.AnyAsync(u => u.Email == entry.Email);
            if (exists)
            {
                continue;
            }

            var user = new User
            {
                Name = entry.Name,
                Email = entry.Email,
                Role = entry.Role,
                CreatedAt = DateTime.UtcNow
            };
            user.PasswordHash = hasher.HashPassword(user, entry.Password);
            context.Users.Add(user);
            added = true;
        }

        if (added)
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedCategoriesAsync(AppDbContext context)
    {
        var seedCategories = new (string Name, string Description)[]
        {
            ("Beverages", "Cold brews, juices, and sparkling drinks"),
            ("Pizzas", "Hand-tossed wood-fired pizzas"),
            ("Bakery & Breads", "Freshly baked loaves, buns, and pastries"),
            ("Healthy Bowls", "Fresh grain and protein bowls"),
            ("Snacks & Sides", "Crispy chips, wraps, and quick bites"),
            ("Desserts", "Cakes, brownies, and sweet treats"),
        };

        var existingNames = await context.Categories
            .Select(c => c.Name.ToLower())
            .ToListAsync();

        var added = false;
        foreach (var (name, description) in seedCategories)
        {
            if (existingNames.Contains(name.ToLower()))
            {
                continue;
            }

            context.Categories.Add(new Category
            {
                Name = name,
                Description = description
            });
            added = true;
        }

        if (added)
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedBrandsAsync(AppDbContext context)
    {
        var seedBrands = new[]
        {
            "QuickBite Kitchen",
            "Artisan Crust",
            "FreshBake Co.",
            "SipCraft",
            "GreenBowl",
            "CrunchCo"
        };

        var existingNames = await context.Brands
            .Select(b => b.Name.ToLower())
            .ToListAsync();

        var added = false;
        foreach (var name in seedBrands)
        {
            if (existingNames.Contains(name.ToLower()))
            {
                continue;
            }

            context.Brands.Add(new Brand { Name = name });
            added = true;
        }

        if (added)
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedProductsAsync(AppDbContext context)
    {
        if (await context.Products.AnyAsync())
        {
            return;
        }

        var categories = await context.Categories.ToDictionaryAsync(c => c.Name, c => c.CategoryId);
        var brands = await context.Brands.ToDictionaryAsync(b => b.Name, b => b.BrandId);

        int CategoryId(string name) => categories[name];
        int BrandId(string name) => brands[name];

        var products = new List<Product>
        {
            new()
            {
                Name = "Margherita Wood-Fired Pizza",
                Description = "San Marzano tomato sauce, fresh mozzarella, and basil on sourdough crust.",
                Price = 12.99m,
                ImageUrl = "/images/Margherita Wood-Fired Pizza.jpg",
                CategoryId = CategoryId("Pizzas"),
                BrandId = BrandId("Artisan Crust"),
                Packaging = "12-inch Box",
                StockQuantity = 25,
                IsAvailable = true
            },
            new()
            {
                Name = "Pepperoni Classic Pizza",
                Description = "Crispy pepperoni slices with aged mozzarella and oregano.",
                Price = 14.99m,
                ImageUrl = "/images/Pepperoni Classic Pizza.jpg",
                CategoryId = CategoryId("Pizzas"),
                BrandId = BrandId("Artisan Crust"),
                Packaging = "12-inch Box",
                StockQuantity = 18,
                IsAvailable = true
            },
            new()
            {
                Name = "Sourdough Garlic Bread",
                Description = "Toasted garlic herb butter sourdough slices.",
                Price = 5.49m,
                ImageUrl = "/images/Sourdough Garlic Bread.jpg",
                CategoryId = CategoryId("Bakery & Breads"),
                BrandId = BrandId("FreshBake Co."),
                Packaging = "6 Pieces Pack",
                StockQuantity = 30,
                IsAvailable = true
            },
            new()
            {
                Name = "Brioche Burger Buns",
                Description = "Soft golden brioche buns baked fresh daily.",
                Price = 4.99m,
                ImageUrl = "/images/Brioche Burger Buns.jpg",
                CategoryId = CategoryId("Bakery & Breads"),
                BrandId = BrandId("FreshBake Co."),
                Packaging = "4-Pack",
                StockQuantity = 8,
                IsAvailable = true
            },
            new()
            {
                Name = "Cold Brew Iced Coffee",
                Description = "18-hour slow-steeped arabica cold brew lightly sweetened.",
                Price = 4.25m,
                ImageUrl = "/images/Cold Brew Iced Coffee.jpg",
                CategoryId = CategoryId("Beverages"),
                BrandId = BrandId("SipCraft"),
                Packaging = "330 ml Bottle",
                StockQuantity = 40,
                IsAvailable = true
            },
            new()
            {
                Name = "Sparkling Mango Lemonade",
                Description = "Alphonso mango puree blended with sparkling lemon juice.",
                Price = 3.75m,
                ImageUrl = "/images/Sparkling Mango Lemonade.jpg",
                CategoryId = CategoryId("Beverages"),
                BrandId = BrandId("SipCraft"),
                Packaging = "300 ml Can",
                StockQuantity = 6,
                IsAvailable = true
            },
            new()
            {
                Name = "Mediterranean Quinoa Bowl",
                Description = "Tri-color quinoa, roasted chickpeas, feta, olives, and lemon tahini dressing.",
                Price = 11.50m,
                ImageUrl = "/images/Mediterranean Quinoa Bowl.jpg",
                CategoryId = CategoryId("Healthy Bowls"),
                BrandId = BrandId("GreenBowl"),
                Packaging = "450 g Bowl",
                StockQuantity = 15,
                IsAvailable = true
            },
            new()
            {
                Name = "Spicy Crispy Chicken Wrap",
                Description = "Crispy spiced chicken tenders with slaw and chipotle mayo in a warm tortilla.",
                Price = 9.75m,
                ImageUrl = "/images/Spicy Crispy Chicken Wrap.jpg",
                CategoryId = CategoryId("Snacks & Sides"),
                BrandId = BrandId("QuickBite Kitchen"),
                Packaging = "Single Wrap",
                StockQuantity = 22,
                IsAvailable = true
            },
            new()
            {
                Name = "Sea Salt Kettle Chips",
                Description = "Thick-cut kettle-cooked potato chips dusted with flaky sea salt.",
                Price = 2.99m,
                ImageUrl = "/images/Sea Salt Kettle Chips.jpg",
                CategoryId = CategoryId("Snacks & Sides"),
                BrandId = BrandId("CrunchCo"),
                Packaging = "120 g Bag",
                StockQuantity = 50,
                IsAvailable = true
            },
            new()
            {
                Name = "Salted Caramel Brownie",
                Description = "Rich dark chocolate fudge brownie swirled with salted caramel.",
                Price = 4.50m,
                ImageUrl = "/images/Salted Caramel Brownie.jpg",
                CategoryId = CategoryId("Desserts"),
                BrandId = BrandId("FreshBake Co."),
                Packaging = "Single Slice",
                StockQuantity = 5,
                IsAvailable = true
            }
        };

        context.Products.AddRange(products);
        await context.SaveChangesAsync();
    }

    private static async Task SeedOrdersAsync(AppDbContext context)
    {
        if (await context.Orders.AnyAsync())
        {
            return;
        }

        var primaryCustomer =
            await context.Users.FirstOrDefaultAsync(u => u.Email == "dharanesh@gmail.com")
            ?? await context.Users.FirstOrDefaultAsync(u => u.Email == "alex@quickbite.com");
        var secondaryCustomer =
            await context.Users.FirstOrDefaultAsync(u => u.Email == "priya@quickbite.com")
            ?? primaryCustomer;

        if (primaryCustomer is null || secondaryCustomer is null)
        {
            return;
        }

        var products = await context.Products.ToDictionaryAsync(p => p.Name);

        Order BuildOrder(int userId, string status, DateTime orderDate, params (string ProductName, int Qty)[] lines)
        {
            var items = lines.Select(line =>
            {
                var product = products[line.ProductName];
                return new OrderItem
                {
                    ProductId = product.ProductId,
                    Quantity = line.Qty,
                    UnitPrice = product.Price
                };
            }).ToList();

            return new Order
            {
                UserId = userId,
                Status = status,
                OrderDate = orderDate,
                TotalAmount = items.Sum(i => i.UnitPrice * i.Quantity),
                OrderItems = items
            };
        }

        var now = DateTime.UtcNow;
        var orders = new List<Order>
        {
            BuildOrder(
                primaryCustomer.UserId,
                "Delivered",
                now.AddDays(-2),
                ("Margherita Wood-Fired Pizza", 2),
                ("Cold Brew Iced Coffee", 2)),
            BuildOrder(
                primaryCustomer.UserId,
                "Out for Delivery",
                now.AddHours(-5),
                ("Mediterranean Quinoa Bowl", 1),
                ("Sparkling Mango Lemonade", 1)),
            BuildOrder(
                secondaryCustomer.UserId,
                "Preparing",
                now.AddHours(-2),
                ("Pepperoni Classic Pizza", 1),
                ("Sourdough Garlic Bread", 1)),
            BuildOrder(
                primaryCustomer.UserId,
                "Pending",
                now.AddMinutes(-25),
                ("Spicy Crispy Chicken Wrap", 2),
                ("Sea Salt Kettle Chips", 2),
                ("Salted Caramel Brownie", 1))
        };

        context.Orders.AddRange(orders);
        await context.SaveChangesAsync();
    }
}
