using SalesOrder.Domain.Entities;

namespace SalesOrder.Application.Interfaces;

public interface IVendorService
{
    Task<List<Vendor>> GetAllAsync();
}