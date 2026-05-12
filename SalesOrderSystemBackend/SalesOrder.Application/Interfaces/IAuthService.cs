using SalesOrder.Application.DTOs;

namespace SalesOrder.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
}