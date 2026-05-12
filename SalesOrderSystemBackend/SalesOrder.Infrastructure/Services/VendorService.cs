using Microsoft.EntityFrameworkCore;
using SalesOrder.Application.Interfaces;
using SalesOrder.Domain.Entities;
using SalesOrder.Infrastructure.Data;

namespace SalesOrder.Infrastructure.Services;

public class VendorService : IVendorService
{
    private readonly AppDbContext _context;

    public VendorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Vendor>> GetAllAsync()
    {
        return await _context.Vendors
            .AsNoTracking()
            .OrderBy(x => x.VendorCode)
            .ToListAsync();
    }
}
