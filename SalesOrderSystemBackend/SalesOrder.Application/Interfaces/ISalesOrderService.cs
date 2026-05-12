using SalesOrder.Application.DTOs;

namespace SalesOrder.Application.Interfaces;

public interface ISalesOrderService
{
    Task<List<SalesOrderDto>> GetAllAsync();

    Task<SalesOrderDto?> GetByIdAsync(int id);

    /// <summary>Next doc number for the given calendar day (sequence within that day). Call on form load / when doc date changes.</summary>
    Task<NextDocNoDto> GetNextDocNoAsync(DateTime? docDate);

    Task<SalesOrderDto> CreateAsync(SalesOrderDto dto);

    Task<SalesOrderDto?> UpdateAsync(int id, SalesOrderDto dto);

    Task<bool> DeleteAsync(int id);
}