namespace SalesOrder.Application.DTOs;

public class CreateUserDto
{
    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public int RoleId { get; set; }
}
