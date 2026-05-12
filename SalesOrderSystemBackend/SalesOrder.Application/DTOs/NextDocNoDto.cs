namespace SalesOrder.Application.DTOs;

/// <summary>Preview of the next document number for a new sales order (same logic used when create omits docNo).</summary>
public class NextDocNoDto
{
    public string DocNo { get; set; } = string.Empty;

    /// <summary>Date used for the sequence (UTC date of docDate query or server today).</summary>
    public DateTime DocDate { get; set; }
}
