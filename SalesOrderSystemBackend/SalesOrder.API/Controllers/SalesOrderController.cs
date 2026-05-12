using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SalesOrder.Application.DTOs;
using SalesOrder.Application.Interfaces;

namespace SalesOrder.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SalesOrderController : ControllerBase
{
    private readonly ISalesOrderService _service;

    public SalesOrderController(
        ISalesOrderService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        return Ok(await _service.GetAllAsync());
    }

    /// <summary>
    /// Next document number for a new order (same value used if create body omits docNo). Optional docDate (ISO); defaults to today (server local date).
    /// </summary>
    [HttpGet("next-doc-no")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetNextDocNo(
        [FromQuery] DateTime? docDate)
    {
        return Ok(await _service.GetNextDocNoAsync(docDate));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _service.GetByIdAsync(id);

        if (order == null)
            return NotFound();

        return Ok(order);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(
        SalesOrderDto dto)
    {
        return Ok(await _service.CreateAsync(dto));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(
        int id,
        SalesOrderDto dto)
    {
        return Ok(await _service.UpdateAsync(id, dto));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        return Ok(await _service.DeleteAsync(id));
    }
}