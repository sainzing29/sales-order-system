using Microsoft.EntityFrameworkCore;
using SalesOrder.Application.DTOs;
using SalesOrder.Application.Interfaces;
using SalesOrder.Domain.Entities;
using SalesOrder.Infrastructure.Data;

namespace SalesOrder.Infrastructure.Services;

public class ItemService : IItemService
{
    private const int SearchResultLimit = 100;

    private readonly AppDbContext _context;

    public ItemService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Items>> GetAllAsync()
    {
        return await _context.Items
            .AsNoTracking()
            .OrderBy(x => x.ItemCode)
            .ToListAsync();
    }

    public async Task<List<ItemListDto>> SearchByCodeAsync(string? search)
    {
        var term = search?.Trim();

        if (string.IsNullOrEmpty(term))
            return new List<ItemListDto>();

        return await _context.Items
            .AsNoTracking()
            .Where(x => x.ItemCode.Contains(term))
            .OrderBy(x => x.ItemCode)
            .Take(SearchResultLimit)
            .Select(x => new ItemListDto
            {
                Code = x.ItemCode,
                Name = x.ItemName,
                Uom = x.UOM,
                Price = x.Price
            })
            .ToListAsync();
    }

    public async Task<List<ItemListDto>> SearchByNameAsync(string? search)
    {
        var term = search?.Trim();

        if (string.IsNullOrEmpty(term))
            return new List<ItemListDto>();

        return await _context.Items
            .AsNoTracking()
            .Where(x => x.ItemName.Contains(term))
            .OrderBy(x => x.ItemName)
            .Take(SearchResultLimit)
            .Select(x => new ItemListDto
            {
                Code = x.ItemCode,
                Name = x.ItemName,
                Uom = x.UOM,
                Price = x.Price
            })
            .ToListAsync();
    }
}
