using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LaborController : ControllerBase
{
    private readonly ILaborService _laborService;

    public LaborController(ILaborService laborService)
    {
        _laborService = laborService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<LaborDto>> GetMe()
    {
        var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(callerIdStr, out int callerId))
        {
            var worker = await _laborService.GetByIdAsync(callerId);
            if (worker != null)
            {
                return Ok(worker);
            }
        }
        return Unauthorized("User profile not found.");
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<LaborDto>>> GetAll()
    {
        var labor = await _laborService.GetAllAsync();
        return Ok(labor);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LaborDto>> GetById(int id)
    {
        var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var isCallerAdmin = User.IsInRole("Admin");

        if (!isCallerAdmin && (!int.TryParse(callerIdStr, out int callerId) || callerId != id))
        {
            return StatusCode(403, "You can only view your own labor record.");
        }

        var worker = await _laborService.GetByIdAsync(id);
        if (worker == null) return NotFound();
        return Ok(worker);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LaborDto>> Create(LaborCreateDto dto)
    {
        var created = await _laborService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.WorkerId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<LaborDto>> Update(int id, LaborCreateDto dto)
    {
        var updated = await _laborService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _laborService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
