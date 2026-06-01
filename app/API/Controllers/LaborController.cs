using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LaborController : ControllerBase
{
    private readonly ILaborService _laborService;

    public LaborController(ILaborService laborService)
    {
        _laborService = laborService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LaborDto>>> GetAll()
    {
        var labor = await _laborService.GetAllAsync();
        return Ok(labor);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LaborDto>> GetById(int id)
    {
        var worker = await _laborService.GetByIdAsync(id);
        if (worker == null) return NotFound();
        return Ok(worker);
    }

    [HttpPost]
    public async Task<ActionResult<LaborDto>> Create(LaborCreateDto dto)
    {
        var created = await _laborService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.WorkerId }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<LaborDto>> Update(int id, LaborCreateDto dto)
    {
        var updated = await _laborService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _laborService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
