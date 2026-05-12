namespace SalesOrder.Application.DTOs;

public class SalesOrderItemDto
{
    /// <summary>Preferred when known (e.g. from item search).</summary>
    public int ItemId { get; set; }

    /// <summary>
    /// Optional: when ItemId is 0 or omitted, server resolves the line from this code (matches Items.ItemCode).
    /// </summary>
    public string? ItemCode { get; set; }

    /// <summary>Ignored on save; useful for UI display only.</summary>
    public string? ItemName { get; set; }

    /// <summary>Ignored on save.</summary>
    public string? Uom { get; set; }

    /// <summary>Ignored on save.</summary>
    public decimal? Price { get; set; }

    public decimal Quantity { get; set; }

    /// <summary>List/detail only: quantity × price.</summary>
    public decimal LineTotal { get; set; }
}