using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;

    public AssignmentsController(IAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IEnumerable<AssignmentDto>>> GetAll()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var assignments = await _assignmentService.GetAllAsync();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                assignments = assignments.Where(a => a.WorkerId == callerId);
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(assignments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AssignmentDto>> GetById(int id)
    {
        var assignment = await _assignmentService.GetByIdAsync(id);
        if (assignment == null) return NotFound();

        var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isCallerAdmin = User.IsInRole("Admin");

        if (!isCallerAdmin && (!int.TryParse(callerIdStr, out int callerId) || assignment.WorkerId != callerId))
        {
            return StatusCode(403, "You can only view your own assignments.");
        }

        return Ok(assignment);
    }

    [HttpGet("check-availability")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> CheckAvailability([FromQuery] int equipId, [FromQuery] string date)
    {
        if (DateOnly.TryParse(date, out var parsedDate))
        {
            var isAssigned = await _assignmentService.IsEquipmentAssignedAsync(equipId, parsedDate);
            return Ok(isAssigned);
        }
        return BadRequest("Invalid date format. Use YYYY-MM-DD.");
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AssignmentDto>> Create(AssignmentCreateDto dto)
    {
        try
        {
            var created = await _assignmentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.AssignId }, created);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException?.Message.Contains("Equipment already assigned") == true || ex.Message.Contains("Equipment already assigned"))
        {
            return BadRequest("Equipment already assigned on this date.");
        }
        catch (System.Exception ex) when (ex.Message.Contains("Equipment already assigned"))
        {
            return BadRequest("Equipment already assigned on this date.");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AssignmentDto>> Update(int id, AssignmentCreateDto dto)
    {
        try
        {
            var updated = await _assignmentService.UpdateAsync(id, dto);
            if (updated == null) return NotFound();
            return Ok(updated);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex) when (ex.InnerException?.Message.Contains("Equipment already assigned") == true || ex.Message.Contains("Equipment already assigned"))
        {
            return BadRequest("Equipment already assigned on this date.");
        }
        catch (System.Exception ex) when (ex.Message.Contains("Equipment already assigned"))
        {
            return BadRequest("Equipment already assigned on this date.");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _assignmentService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
