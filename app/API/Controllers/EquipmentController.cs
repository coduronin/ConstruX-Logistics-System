using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EquipmentController : ControllerBase
{
    private readonly IEquipmentService _equipmentService;

    public EquipmentController(IEquipmentService equipmentService)
    {
        _equipmentService = equipmentService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<EquipmentDto>>> GetAll()
    {
        var equipments = await _equipmentService.GetAllAsync();
        return Ok(equipments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EquipmentDto>> GetById(int id)
    {
        var equipment = await _equipmentService.GetByIdAsync(id);
        if (equipment == null) return NotFound();
        return Ok(equipment);
    }

    [HttpPost]
    public async Task<ActionResult<EquipmentDto>> Create(EquipmentCreateDto dto)
    {
        var created = await _equipmentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.EquipId }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<EquipmentDto>> Update(int id, EquipmentCreateDto dto)
    {
        var updated = await _equipmentService.UpdateAsync(id, dto);
        if (updated == null) return NotFound();
        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _equipmentService.DeleteAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
