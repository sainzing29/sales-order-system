using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SalesOrder.Application.DTOs;
using SalesOrder.Application.Interfaces;
using SalesOrder.Domain.Entities;
using SalesOrder.Infrastructure.Data;

namespace SalesOrder.Infrastructure.Services;

public class UserService : IUserService
{
    private const int MinimumPasswordLength = 6;

    private readonly AppDbContext _context;

    private readonly IPasswordHasher<User> _passwordHasher;

    public UserService(
        AppDbContext context,
        IPasswordHasher<User> passwordHasher)
    {
        _context = context;

        _passwordHasher = passwordHasher;
    }

    public async Task<List<UserDto>> GetAllAsync()
    {
        return await _context.Users
            .Include(x => x.Role)
            .Select(x => new UserDto
            {
                Id = x.Id,

                Username = x.Username,

                RoleId = x.RoleId,

                RoleName = x.Role!.Name
            })
            .ToListAsync();
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        var username = dto.Username.Trim();

        if (string.IsNullOrEmpty(username))
            throw new ArgumentException("Username is required.");

        if (string.IsNullOrEmpty(dto.Password))
            throw new ArgumentException("Password is required.");

        if (dto.Password.Length < MinimumPasswordLength)
            throw new ArgumentException(
                $"Password must be at least {MinimumPasswordLength} characters.");

        var usernameTaken = await _context.Users
            .AnyAsync(x => x.Username == username);

        if (usernameTaken)
            throw new ArgumentException("Username is already taken.");

        var roleExists = await _context.Roles
            .AnyAsync(x => x.Id == dto.RoleId);

        if (!roleExists)
            throw new ArgumentException("Invalid RoleId.");

        var user = new User
        {
            Username = username,

            RoleId = dto.RoleId
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        await _context.Entry(user)
            .Reference(x => x.Role)
            .LoadAsync();

        return new UserDto
        {
            Id = user.Id,

            Username = user.Username,

            RoleId = user.RoleId,

            RoleName = user.Role!.Name
        };
    }
}