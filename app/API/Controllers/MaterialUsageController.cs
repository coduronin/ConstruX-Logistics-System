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
public class MaterialUsageController : ControllerBase
{
    private readonly IMaterialUsageService _materialUsageService;
    private readonly AppDbContext _context;

    public MaterialUsageController(IMaterialUsageService materialUsageService, AppDbContext context)
    {
        _materialUsageService = materialUsageService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaterialUsageDto>>> GetAll()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var usages = await _materialUsageService.GetAllAsync();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var assignedSiteIds = await _context.Assignments
                    .Where(a => a.WorkerId == callerId)
                    .Select(a => a.SiteId)
                    .Distinct()
                    .ToListAsync();

                usages = usages.Where(u => assignedSiteIds.Contains(u.SiteId));
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(usages);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaterialUsageDto>> GetById(int id)
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var usage = await _materialUsageService.GetByIdAsync(id);
        if (usage == null) return NotFound();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var isAssigned = await _context.Assignments
                    .AnyAsync(a => a.WorkerId == callerId && a.SiteId == usage.SiteId);

                if (!isAssigned)
                {
                    return StatusCode(403, "You do not have access to this material usage record.");
                }
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(usage);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MaterialUsageDto>> Create(MaterialUsageCreateDto dto)
    {
        var created = await _materialUsageService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.UsageId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MaterialUsageDto>> Update(int id, MaterialUsageCreateDto dto)
    {
        var updated = await _materialUsageService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _materialUsageService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
