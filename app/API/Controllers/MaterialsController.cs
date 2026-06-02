using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;

    public MaterialsController(IMaterialService materialService)
    {
        _materialService = materialService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MaterialDto>>> GetAll()
    {
        var materials = await _materialService.GetAllAsync();
        return Ok(materials);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MaterialDto>> GetById(int id)
    {
        var material = await _materialService.GetByIdAsync(id);
        if (material == null) return NotFound();
        return Ok(material);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MaterialDto>> Create(MaterialCreateDto dto)
    {
        var created = await _materialService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.MatId }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<MaterialDto>> Update(int id, MaterialCreateDto dto)
    {
        var updated = await _materialService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _materialService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
