using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaintenanceLogsController : ControllerBase
{
    private readonly IMaintenanceLogService _maintenanceLogService;
    private readonly AppDbContext _context;

    public MaintenanceLogsController(IMaintenanceLogService maintenanceLogService, AppDbContext context)
    {
        _maintenanceLogService = maintenanceLogService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaintenanceLogDto>>> GetAll()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var logs = await _maintenanceLogService.GetAllAsync();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var assignedEquipIds = await _context.Assignments
                    .Where(a => a.WorkerId == callerId && a.EquipId != null)
                    .Select(a => a.EquipId)
                    .Distinct()
                    .ToListAsync();

                logs = logs.Where(l => assignedEquipIds.Contains(l.EquipId));
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(logs);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaintenanceLogDto>> GetById(int id)
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var log = await _maintenanceLogService.GetByIdAsync(id);
        if (log == null) return NotFound();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var isAssigned = await _context.Assignments
                    .AnyAsync(a => a.WorkerId == callerId && a.EquipId == log.EquipId);

                if (!isAssigned)
                {
                    return StatusCode(403, "You do not have access to this maintenance log.");
                }
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(log);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MaintenanceLogDto>> Create(MaintenanceLogCreateDto dto)
    {
        var created = await _maintenanceLogService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.LogId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MaintenanceLogDto>> Update(int id, MaintenanceLogCreateDto dto)
    {
        var updated = await _maintenanceLogService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _maintenanceLogService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
