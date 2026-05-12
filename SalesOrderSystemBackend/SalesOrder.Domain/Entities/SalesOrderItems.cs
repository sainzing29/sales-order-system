namespace SalesOrder.Domain.Entities;

public class SalesOrderItems
{
    public int Id { get; set; }

    public int SalesOrderId { get; set; }

    public SalesOrders? SalesOrder { get; set; }

    public int ItemId { get; set; }

    public Items? Item { get; set; }

    public decimal Quantity { get; set; }
}