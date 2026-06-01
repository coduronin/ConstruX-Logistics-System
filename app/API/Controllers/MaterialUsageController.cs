using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialUsageController : ControllerBase
{
    private readonly IMaterialUsageService _materialUsageService;

    public MaterialUsageController(IMaterialUsageService materialUsageService)
    {
        _materialUsageService = materialUsageService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaterialUsageDto>>> GetAll()
    {
        var usages = await _materialUsageService.GetAllAsync();
        return Ok(usages);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaterialUsageDto>> GetById(int id)
    {
        var usage = await _materialUsageService.GetByIdAsync(id);
        if (usage == null) return NotFound();
        return Ok(usage);
    }

    [HttpPost]
    public async Task<ActionResult<MaterialUsageDto>> Create(MaterialUsageCreateDto dto)
    {
        var created = await _materialUsageService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.UsageId }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MaterialUsageDto>> Update(int id, MaterialUsageCreateDto dto)
    {
        var updated = await _materialUsageService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _materialUsageService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
