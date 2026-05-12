using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesOrder.Application.Interfaces;

namespace SalesOrder.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ItemController : ControllerBase
{
    private readonly IItemService _itemService;

    public ItemController(
        IItemService itemService)
    {
        _itemService = itemService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _itemService
            .GetAllAsync();

        return Ok(result);
    }

    /// <summary>
    /// Dropdown search: filter items where code contains the search text.
    /// </summary>
    [HttpGet("by-code")]
    public async Task<IActionResult> GetByCode(
        [FromQuery] string? search)
    {
        return Ok(await _itemService.SearchByCodeAsync(search));
    }

    /// <summary>
    /// Dropdown search: filter items where name contains the search text.
    /// </summary>
    [HttpGet("by-name")]
    public async Task<IActionResult> GetByName(
        [FromQuery] string? search)
    {
        return Ok(await _itemService.SearchByNameAsync(search));
    }
}