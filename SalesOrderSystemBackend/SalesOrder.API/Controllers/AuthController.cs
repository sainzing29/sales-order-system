using Microsoft.AspNetCore.Mvc;
using SalesOrder.Application.DTOs;
using SalesOrder.Application.Interfaces;

namespace SalesOrder.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(
        IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginDto dto)
    {
        var result = await _authService
            .LoginAsync(dto);

        if (result == null)
            return Unauthorized(new
            {
                Message = "Invalid username or password"
            });

        return Ok(result);
    }
}