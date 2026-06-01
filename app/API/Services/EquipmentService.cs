using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface IEquipmentService
{
    Task<IEnumerable<EquipmentDto>> GetAllAsync();
    Task<EquipmentDto?> GetByIdAsync(int id);
    Task<EquipmentDto> CreateAsync(EquipmentCreateDto dto);
    Task<EquipmentDto?> UpdateAsync(int id, EquipmentCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class EquipmentService : IEquipmentService
{
    private readonly AppDbContext _context;

    public EquipmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<EquipmentDto>> GetAllAsync()
    {
        var equipments = await _context.Equipment.ToListAsync();
        return equipments.Select(MapToDto);
    }

    public async Task<EquipmentDto?> GetByIdAsync(int id)
    {
        var equipment = await _context.Equipment.FindAsync(id);
        return equipment == null ? null : MapToDto(equipment);
    }

    public async Task<EquipmentDto> CreateAsync(EquipmentCreateDto dto)
    {
        var equipment = new Equipment
        {
            Type = dto.Type,
            Model = dto.Model,
            CurrentStatus = dto.CurrentStatus
        };

        _context.Equipment.Add(equipment);
        await _context.SaveChangesAsync();

        return MapToDto(equipment);
    }

    public async Task<EquipmentDto?> UpdateAsync(int id, EquipmentCreateDto dto)
    {
        var equipment = await _context.Equipment.FindAsync(id);
        if (equipment == null) return null;

        equipment.Type = dto.Type;
        equipment.Model = dto.Model;
        equipment.CurrentStatus = dto.CurrentStatus;

        await _context.SaveChangesAsync();
        return MapToDto(equipment);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var equipment = await _context.Equipment.FindAsync(id);
        if (equipment == null) return false;

        // Set EquipId to null for all assignments referencing this equipment to avoid foreign key violations
        var assignments = await _context.Assignments.Where(a => a.EquipId == id).ToListAsync();
        foreach (var assignment in assignments)
        {
            assignment.EquipId = null;
        }

        // Note: maintenance_logs table handles deletion via ON DELETE CASCADE in SQLite schema.
        _context.Equipment.Remove(equipment);
        await _context.SaveChangesAsync();
        return true;
    }

    private static EquipmentDto MapToDto(Equipment equipment) => new()
    {
        EquipId = equipment.EquipId,
        Type = equipment.Type,
        Model = equipment.Model,
        CurrentStatus = equipment.CurrentStatus
    };
}
