namespace SalesOrder.Domain.Entities;

public class SalesOrders
{
    public int Id { get; set; }

    public string DocNo { get; set; } = string.Empty;

    public DateTime DocDate { get; set; }

    public int VendorId { get; set; }

    public Vendor? Vendor { get; set; }

    public ICollection<SalesOrderItems> SalesOrderItems { get; set; }
        = new List<SalesOrderItems>();
}