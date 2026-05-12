namespace SalesOrder.Application.DTOs;

public class SalesOrderDto
{
    public int Id { get; set; }

    public string DocNo { get; set; } = string.Empty;

    public DateTime DocDate { get; set; }

    public int VendorId { get; set; }

    /// <summary>List/detail only: from Vendor navigation.</summary>
    public string VendorCode { get; set; } = string.Empty;

    /// <summary>List/detail only: from Vendor navigation.</summary>
    public string VendorName { get; set; } = string.Empty;

    /// <summary>Sum of line totals (quantity × unit price).</summary>
    public decimal TotalAmount { get; set; }

    public List<SalesOrderItemDto> Items { get; set; }
        = new();
}