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
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;
    private readonly AppDbContext _context;

    public EquipmentController(IEquipmentService equipmentService, AppDbContext context)
    {
        _equipmentService = equipmentService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetAll()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var equipments = await _equipmentService.GetAllAsync();

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

                equipments = equipments.Where(e => assignedEquipIds.Contains(e.EquipId));
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(equipments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EquipmentDto>> GetById(int id)
    {
        var isCallerAdmin = User.IsInRole("Admin");

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var isAssigned = await _context.Assignments
                    .AnyAsync(a => a.WorkerId == callerId && a.EquipId == id);

                if (!isAssigned)
                {
                    return StatusCode(403, "You are not assigned to this equipment.");
                }
            }
            else
            {
                return Forbid();
            }
        }

        var equipment = await _equipmentService.GetByIdAsync(id);
        if (equipment == null) return NotFound();
        return Ok(equipment);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<EquipmentDto>> Create(EquipmentCreateDto dto)
    {
        var created = await _equipmentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.EquipId }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EquipmentDto>> Update(int id, EquipmentCreateDto dto)
    {
        var isCallerAdmin = User.IsInRole("Admin");
        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var isAssigned = await _context.Assignments
                    .AnyAsync(a => a.WorkerId == callerId && a.EquipId == id);

                if (!isAssigned)
                {
                    return StatusCode(403, "You are not assigned to this equipment.");
                }
            }
            else
            {
                return Forbid();
            }

            var existing = await _equipmentService.GetByIdAsync(id);
            if (existing == null) return NotFound();

            dto.Type = existing.Type;
            dto.Model = existing.Model;
        }

        var updated = await _equipmentService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _equipmentService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
