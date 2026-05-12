using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SalesOrder.Application.DTOs;
using SalesOrder.Application.Interfaces;
using SalesOrder.Domain.Entities;
using SalesOrder.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SalesOrder.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;

    private readonly IConfiguration _configuration;

    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthService(
        AppDbContext context,
        IConfiguration configuration,
        IPasswordHasher<User> passwordHasher)
    {
        _context = context;

        _configuration = configuration;

        _passwordHasher = passwordHasher;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .Include(x => x.Role)
            .FirstOrDefaultAsync(x =>
                x.Username == dto.Username);

        if (user == null)
            return null;

        var verify = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.Password);

        if (verify == PasswordVerificationResult.Failed)
            return null;

        if (verify == PasswordVerificationResult.SuccessRehashNeeded)
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            await _context.SaveChangesAsync();
        }

        var claims = new[]
        {
            new Claim(ClaimTypes.Name, user.Username),

            new Claim(ClaimTypes.Role,
                user.Role!.Name)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"]!));

        var creds = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(2),
            signingCredentials: creds);

        return new LoginResponseDto
        {
            Token = new JwtSecurityTokenHandler()
                .WriteToken(token),

            Username = user.Username,

            Role = user.Role.Name
        };
    }
}