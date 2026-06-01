using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SitesController : ControllerBase
{
    private readonly ISiteService _siteService;

    public SitesController(ISiteService siteService)
    {
        _siteService = siteService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SiteDto>>> GetAll()
    {
        var sites = await _siteService.GetAllAsync();
        return Ok(sites);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SiteDto>> GetById(int id)
    {
        var site = await _siteService.GetByIdAsync(id);
        if (site == null) return NotFound();
        return Ok(site);
    }

    [HttpPost]
    public async Task<ActionResult<SiteDto>> Create(SiteCreateDto dto)
    {
        var created = await _siteService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.SiteId }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SiteDto>> Update(int id, SiteCreateDto dto)
    {
        var updated = await _siteService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _siteService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
