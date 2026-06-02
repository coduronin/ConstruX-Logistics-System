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

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AssignmentDto>> Create(AssignmentCreateDto dto)
    {
        var created = await _assignmentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.AssignId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AssignmentDto>> Update(int id, AssignmentCreateDto dto)
    {
        var updated = await _assignmentService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
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
