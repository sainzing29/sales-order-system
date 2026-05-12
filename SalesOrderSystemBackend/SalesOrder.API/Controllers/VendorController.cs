using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesOrder.Application.Interfaces;

namespace SalesOrder.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VendorController : ControllerBase
{
    private readonly IVendorService _vendorService;

    public VendorController(
        IVendorService vendorService)
    {
        _vendorService = vendorService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var result = await _vendorService
            .GetAllAsync();

        return Ok(result);
    }
}