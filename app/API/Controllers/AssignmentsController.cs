using System.Collections.Generic;
using System.Threading.Tasks;
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
    public async Task<ActionResult<IEnumerable<AssignmentDto>>> GetAll()
    {
        var assignments = await _assignmentService.GetAllAsync();
        return Ok(assignments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AssignmentDto>> GetById(int id)
    {
        var assignment = await _assignmentService.GetByIdAsync(id);
        if (assignment == null) return NotFound();
        return Ok(assignment);
    }

    [HttpPost]
    public async Task<ActionResult<AssignmentDto>> Create(AssignmentCreateDto dto)
    {
        var created = await _assignmentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.AssignId }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<AssignmentDto>> Update(int id, AssignmentCreateDto dto)
    {
        var updated = await _assignmentService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _assignmentService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
