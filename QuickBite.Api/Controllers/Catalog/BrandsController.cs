using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickBite.Api.DTOs.Catalog;
using QuickBite.Api.Services.Catalog;

namespace QuickBite.Api.Controllers.Catalog;

[ApiController]
[Route("api/brands")]
public class BrandsController : ControllerBase
{
    private readonly BrandService _brandService;

    public BrandsController(BrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<BrandResponse>>> GetAll()
    {
        var brands = await _brandService.GetAllAsync();
        return Ok(brands);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<ActionResult<BrandResponse>> GetById(int id)
    {
        var brand = await _brandService.GetByIdAsync(id);
        if (brand is null)
        {
            return NotFound(new { message = "Brand not found." });
        }

        return Ok(brand);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BrandResponse>> Create([FromBody] BrandRequest request)
    {
        try
        {
            var created = await _brandService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.BrandId }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<BrandResponse>> Update(int id, [FromBody] BrandRequest request)
    {
        try
        {
            var updated = await _brandService.UpdateAsync(id, request);
            if (updated is null)
            {
                return NotFound(new { message = "Brand not found." });
            }

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var deleted = await _brandService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = "Brand not found." });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}

