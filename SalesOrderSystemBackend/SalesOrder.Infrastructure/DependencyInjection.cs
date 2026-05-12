using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using SalesOrder.Domain.Entities;

namespace SalesOrder.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddPasswordHashing(this IServiceCollection services)
    {
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();

        return services;
    }
}
