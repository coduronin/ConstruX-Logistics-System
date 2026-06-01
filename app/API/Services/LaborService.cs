using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface ILaborService
{
    Task<IEnumerable<LaborDto>> GetAllAsync();
    Task<LaborDto?> GetByIdAsync(int id);
    Task<LaborDto> CreateAsync(LaborCreateDto dto);
    Task<LaborDto?> UpdateAsync(int id, LaborCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class LaborService : ILaborService
{
    private readonly AppDbContext _context;

    public LaborService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<LaborDto>> GetAllAsync()
    {
        var labors = await _context.Labor.ToListAsync();
        return labors.Select(MapToDto);
    }

    public async Task<LaborDto?> GetByIdAsync(int id)
    {
        var labor = await _context.Labor.FindAsync(id);
        return labor == null ? null : MapToDto(labor);
    }

    public async Task<LaborDto> CreateAsync(LaborCreateDto dto)
    {
        var labor = new Labor
        {
            Name = dto.Name,
            TradeSpecialty = dto.TradeSpecialty,
            HourlyRate = dto.HourlyRate
        };

        _context.Labor.Add(labor);
        await _context.SaveChangesAsync();

        return MapToDto(labor);
    }

    public async Task<LaborDto?> UpdateAsync(int id, LaborCreateDto dto)
    {
        var labor = await _context.Labor.FindAsync(id);
        if (labor == null) return null;

        labor.Name = dto.Name;
        labor.TradeSpecialty = dto.TradeSpecialty;
        labor.HourlyRate = dto.HourlyRate;

        await _context.SaveChangesAsync();
        return MapToDto(labor);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var labor = await _context.Labor.FindAsync(id);
        if (labor == null) return false;

        // Set WorkerId to null for all assignments referencing this worker to avoid foreign key violations
        var assignments = await _context.Assignments.Where(a => a.WorkerId == id).ToListAsync();
        foreach (var assignment in assignments)
        {
            assignment.WorkerId = null;
        }

        _context.Labor.Remove(labor);
        await _context.SaveChangesAsync();
        return true;
    }

    private static LaborDto MapToDto(Labor labor) => new()
    {
        WorkerId = labor.WorkerId,
        Name = labor.Name,
        TradeSpecialty = labor.TradeSpecialty,
        HourlyRate = labor.HourlyRate
    };
}
