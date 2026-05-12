using Microsoft.EntityFrameworkCore;
using SalesOrder.Application.DTOs;
using SalesOrder.Application.Interfaces;
using SalesOrder.Domain.Entities;
using SalesOrder.Infrastructure.Data;

namespace SalesOrder.Infrastructure.Services;

public class SalesOrderService : ISalesOrderService
{
    private readonly AppDbContext _context;

    public SalesOrderService(AppDbContext context)
    {
        _context = context;
    }

    #region Get All

    public async Task<List<SalesOrderDto>> GetAllAsync()
    {
        return await _context.SalesOrder
            .AsNoTracking()
            .Include(x => x.Vendor)
            .Include(x => x.SalesOrderItems)
                .ThenInclude(x => x.Item)
            .Select(x => new SalesOrderDto
            {
                Id = x.Id,
                DocNo = x.DocNo,
                DocDate = x.DocDate,
                VendorId = x.VendorId,

                VendorCode = x.Vendor != null ? x.Vendor.VendorCode : string.Empty,

                VendorName = x.Vendor != null ? x.Vendor.VendorName : string.Empty,

                TotalAmount = x.SalesOrderItems.Sum(i =>
                    i.Item != null
                        ? i.Item.Price * i.Quantity
                        : 0m),

                Items = x.SalesOrderItems
                    .Select(i => new SalesOrderItemDto
                    {
                        ItemId = i.ItemId,

                        ItemCode = i.Item != null ? i.Item.ItemCode : null,

                        ItemName = i.Item != null ? i.Item.ItemName : null,

                        Uom = i.Item != null ? i.Item.UOM : null,

                        Price = i.Item != null ? i.Item.Price : null,

                        Quantity = i.Quantity,

                        LineTotal = i.Item != null
                            ? i.Item.Price * i.Quantity
                            : 0m
                    }).ToList()
            }).ToListAsync();
    }

    #endregion

    #region Get By Id

    public async Task<SalesOrderDto?> GetByIdAsync(int id)
    {
        var x = await _context.SalesOrder
            .AsNoTracking()
            .Include(o => o.Vendor)
            .Include(o => o.SalesOrderItems)
                .ThenInclude(i => i.Item)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (x == null)
            return null;

        return MapToSalesOrderDto(x);
    }

    #endregion

    #region Next doc number

    public async Task<NextDocNoDto> GetNextDocNoAsync(DateTime? docDate)
    {
        var d = (docDate ?? DateTime.Today).Date;

        return new NextDocNoDto
        {
            DocNo = await GenerateNextDocNoAsync(d),
            DocDate = d
        };
    }

    #endregion

    #region Create

    public async Task<SalesOrderDto> CreateAsync(
        SalesOrderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.DocNo))
            dto.DocNo = await GenerateNextDocNoAsync(dto.DocDate.Date);
        else
            dto.DocNo = dto.DocNo.Trim();

        var salesOrder = new SalesOrders
        {
            DocNo = dto.DocNo,
            DocDate = dto.DocDate,
            VendorId = dto.VendorId
        };

        _context.SalesOrder.Add(salesOrder);

        await _context.SaveChangesAsync();

        if (dto.Items != null && dto.Items.Any())
        {
            var orderItems = new List<SalesOrderItems>();

            foreach (var line in dto.Items)
            {
                var itemId = await ResolveItemIdAsync(line);

                if (itemId == null)
                    throw new ArgumentException(
                        $"Line item not found: use a valid itemId or itemCode (got itemId={line.ItemId}, itemCode={line.ItemCode}).");

                orderItems.Add(new SalesOrderItems
                {
                    SalesOrderId = salesOrder.Id,
                    ItemId = itemId.Value,
                    Quantity = line.Quantity
                });
            }

            _context.SalesOrderItems.AddRange(orderItems);

            await _context.SaveChangesAsync();
        }

        dto.Id = salesOrder.Id;

        return dto;
    }

    #endregion

    #region Update

    public async Task<SalesOrderDto?> UpdateAsync(
        int id,
        SalesOrderDto dto)
    {
        var salesOrder = await _context.SalesOrder
            .Include(x => x.SalesOrderItems)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (salesOrder == null)
            return null;

        if (string.IsNullOrWhiteSpace(dto.DocNo))
            throw new ArgumentException("DocNo is required.");

        salesOrder.DocNo = dto.DocNo.Trim();
        salesOrder.DocDate = dto.DocDate;
        salesOrder.VendorId = dto.VendorId;

        _context.SalesOrderItems
            .RemoveRange(salesOrder.SalesOrderItems);

        var newLines = new List<SalesOrderItems>();

        foreach (var line in dto.Items)
        {
            var itemId = await ResolveItemIdAsync(line);

            if (itemId == null)
                throw new ArgumentException(
                    $"Line item not found: use a valid itemId or itemCode (got itemId={line.ItemId}, itemCode={line.ItemCode}).");

            newLines.Add(new SalesOrderItems
            {
                SalesOrderId = salesOrder.Id,
                ItemId = itemId.Value,
                Quantity = line.Quantity
            });
        }

        salesOrder.SalesOrderItems = newLines;

        await _context.SaveChangesAsync();

        return dto;
    }

    #endregion

    #region Delete

    public async Task<bool> DeleteAsync(int id)
    {
        var salesOrder = await _context.SalesOrder
            .Include(x => x.SalesOrderItems)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (salesOrder == null)
            return false;

        _context.SalesOrderItems
            .RemoveRange(salesOrder.SalesOrderItems);

        _context.SalesOrder.Remove(salesOrder);

        await _context.SaveChangesAsync();

        return true;
    }

    #endregion

    private static SalesOrderDto MapToSalesOrderDto(SalesOrders x)
    {
        var items = x.SalesOrderItems
            .Select(i =>
            {
                var price = i.Item?.Price;
                var qty = i.Quantity;
                var lineTotal = price.HasValue ? price.Value * qty : 0m;

                return new SalesOrderItemDto
                {
                    ItemId = i.ItemId,

                    ItemCode = i.Item?.ItemCode,

                    ItemName = i.Item?.ItemName,

                    Uom = i.Item?.UOM,

                    Price = price,

                    Quantity = qty,

                    LineTotal = lineTotal
                };
            })
            .ToList();

        return new SalesOrderDto
        {
            Id = x.Id,

            DocNo = x.DocNo,

            DocDate = x.DocDate,

            VendorId = x.VendorId,

            VendorCode = x.Vendor?.VendorCode ?? string.Empty,

            VendorName = x.Vendor?.VendorName ?? string.Empty,

            TotalAmount = items.Sum(l => l.LineTotal),

            Items = items
        };
    }

    /// <summary>
    /// Uses ItemId when it refers to an existing item; otherwise resolves by ItemCode (trimmed, exact match).
    /// </summary>
    private async Task<int?> ResolveItemIdAsync(SalesOrderItemDto line)
    {
        if (line.ItemId > 0)
        {
            var byId = await _context.Items
                .AsNoTracking()
                .AnyAsync(x => x.Id == line.ItemId);

            return byId ? line.ItemId : null;
        }

        if (!string.IsNullOrWhiteSpace(line.ItemCode))
        {
            var code = line.ItemCode.Trim();

            var item = await _context.Items
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ItemCode == code);

            return item?.Id;
        }

        return null;
    }

    /// <summary>
    /// Format <c>SO-yyyyMMdd-###</c> where ### is 1-based daily sequence (existing rows with same prefix).
    /// </summary>
    private async Task<string> GenerateNextDocNoAsync(DateTime docDate)
    {
        var d = docDate.Date;

        var prefix = $"SO-{d:yyyyMMdd}-";

        var docsForDay = await _context.SalesOrder
            .AsNoTracking()
            .Where(x => x.DocNo.StartsWith(prefix))
            .Select(x => x.DocNo)
            .ToListAsync();

        var maxSeq = 0;

        foreach (var doc in docsForDay)
        {
            if (doc.Length > prefix.Length
                && int.TryParse(
                    doc.AsSpan(prefix.Length),
                    out var n))
            {
                maxSeq = Math.Max(maxSeq, n);
            }
        }

        var nextSeq = maxSeq + 1;

        return $"{prefix}{nextSeq:D4}";
    }
}