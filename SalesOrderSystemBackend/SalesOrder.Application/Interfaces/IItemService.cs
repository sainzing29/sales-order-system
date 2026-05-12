using SalesOrder.Application.DTOs;
using SalesOrder.Domain.Entities;

namespace SalesOrder.Application.Interfaces;

public interface IItemService
{
    Task<List<Items>> GetAllAsync();

    Task<List<ItemListDto>> SearchByCodeAsync(string? search);

    Task<List<ItemListDto>> SearchByNameAsync(string? search);
}