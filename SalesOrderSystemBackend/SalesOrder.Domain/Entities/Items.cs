namespace SalesOrder.Domain.Entities;

public class Items
{
    public int Id { get; set; }

    public string ItemCode { get; set; } = string.Empty;

    public string ItemName { get; set; } = string.Empty;

    public string UOM { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public ICollection<SalesOrderItems> SalesOrderItems { get; set; }
        = new List<SalesOrderItems>();
}