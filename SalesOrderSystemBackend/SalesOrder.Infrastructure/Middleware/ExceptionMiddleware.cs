using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;

namespace SalesOrder.Infrastructure.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger)
    {
        _next = next;

        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (ex is ArgumentException)
            {
                _logger.LogWarning(ex, ex.Message);

                context.Response.ContentType =
                    "application/json";

                context.Response.StatusCode =
                    (int)HttpStatusCode.BadRequest;

                var badRequest = new
                {
                    Message = "Bad Request",

                    Details = ex.Message
                };

                await context.Response.WriteAsync(
                    JsonSerializer.Serialize(badRequest));

                return;
            }

            _logger.LogError(ex, ex.Message);

            context.Response.ContentType =
                "application/json";

            context.Response.StatusCode =
                (int)HttpStatusCode.InternalServerError;

            var response = new
            {
                Message = "Internal Server Error",

                Details = ex.Message
            };

            await context.Response.WriteAsync(
                JsonSerializer.Serialize(response));
        }
    }
}