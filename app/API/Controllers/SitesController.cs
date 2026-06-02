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
public class SitesController : ControllerBase
{
    private readonly ISiteService _siteService;
    private readonly AppDbContext _context;

    public SitesController(ISiteService siteService, AppDbContext context)
    {
        _siteService = siteService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SiteDto>>> GetAll()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var sites = await _siteService.GetAllAsync();

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

                sites = sites.Where(s => assignedSiteIds.Contains(s.SiteId));
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(sites);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SiteDto>> GetById(int id)
    {
        var isCallerAdmin = User.IsInRole("Admin");

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var isAssigned = await _context.Assignments
                    .AnyAsync(a => a.WorkerId == callerId && a.SiteId == id);

                if (!isAssigned)
                {
                    return StatusCode(403, "You are not assigned to this project site.");
                }
            }
            else
            {
                return Forbid();
            }
        }

        var site = await _siteService.GetByIdAsync(id);
        if (site == null) return NotFound();
        return Ok(site);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SiteDto>> Create(SiteCreateDto dto)
    {
        var created = await _siteService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.SiteId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<SiteDto>> Update(int id, SiteCreateDto dto)
    {
        var updated = await _siteService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _siteService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
