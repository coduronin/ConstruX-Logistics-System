using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaintenanceLogsController : ControllerBase
{
    private readonly IMaintenanceLogService _maintenanceLogService;

    public MaintenanceLogsController(IMaintenanceLogService maintenanceLogService)
    {
        _maintenanceLogService = maintenanceLogService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaintenanceLogDto>>> GetAll()
    {
        var logs = await _maintenanceLogService.GetAllAsync();
        return Ok(logs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaintenanceLogDto>> GetById(int id)
    {
        var log = await _maintenanceLogService.GetByIdAsync(id);
        if (log == null) return NotFound();
        return Ok(log);
    }

    [HttpPost]
    public async Task<ActionResult<MaintenanceLogDto>> Create(MaintenanceLogCreateDto dto)
    {
        var created = await _maintenanceLogService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.LogId }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MaintenanceLogDto>> Update(int id, MaintenanceLogCreateDto dto)
    {
        var updated = await _maintenanceLogService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _maintenanceLogService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
