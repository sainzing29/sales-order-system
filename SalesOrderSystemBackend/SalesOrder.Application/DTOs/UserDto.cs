namespace SalesOrder.Application.DTOs;

public class UserDto
{
    public int Id { get; set; }

    public string Username { get; set; } = string.Empty;

    public int RoleId { get; set; }

    public string RoleName { get; set; } = string.Empty;
}