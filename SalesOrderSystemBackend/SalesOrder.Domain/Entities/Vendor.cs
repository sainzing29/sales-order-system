namespace SalesOrder.Domain.Entities;

public class Vendor
{
    public int Id { get; set; }

    public string VendorCode { get; set; } = string.Empty;

    public string VendorName { get; set; } = string.Empty;

    public ICollection<SalesOrders> SalesOrders { get; set; }
        = new List<SalesOrders>();
}