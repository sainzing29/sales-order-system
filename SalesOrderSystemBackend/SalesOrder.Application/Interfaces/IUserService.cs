using SalesOrder.Application.DTOs;

namespace SalesOrder.Application.Interfaces;

public interface IUserService
{
    Task<List<UserDto>> GetAllAsync();

    Task<UserDto> CreateAsync(CreateUserDto dto);
}