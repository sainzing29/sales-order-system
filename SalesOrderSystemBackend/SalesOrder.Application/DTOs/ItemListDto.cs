namespace SalesOrder.Application.DTOs;

public class ItemListDto
{
    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Uom { get; set; } = string.Empty;

    public decimal Price { get; set; }
}
