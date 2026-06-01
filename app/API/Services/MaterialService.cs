using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface IMaterialService
{
    Task<IEnumerable<MaterialDto>> GetAllAsync();
    Task<MaterialDto?> GetByIdAsync(int id);
    Task<MaterialDto> CreateAsync(MaterialCreateDto dto);
    Task<MaterialDto?> UpdateAsync(int id, MaterialCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class MaterialService : IMaterialService
{
    private readonly AppDbContext _context;

    public MaterialService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MaterialDto>> GetAllAsync()
    {
        var materials = await _context.Materials.ToListAsync();
        return materials.Select(MapToDto);
    }

    public async Task<MaterialDto?> GetByIdAsync(int id)
    {
        var material = await _context.Materials.FindAsync(id);
        return material == null ? null : MapToDto(material);
    }

    public async Task<MaterialDto> CreateAsync(MaterialCreateDto dto)
    {
        var material = new Material
        {
            Name = dto.Name,
            Unit = dto.Unit,
            UnitCost = dto.UnitCost
        };

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        return MapToDto(material);
    }

    public async Task<MaterialDto?> UpdateAsync(int id, MaterialCreateDto dto)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material == null) return null;

        material.Name = dto.Name;
        material.Unit = dto.Unit;
        material.UnitCost = dto.UnitCost;

        await _context.SaveChangesAsync();
        return MapToDto(material);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material == null) return false;

        // Set MatId to null for all usages referencing this material to avoid foreign key violations
        var usages = await _context.MaterialUsages.Where(mu => mu.MatId == id).ToListAsync();
        foreach (var usage in usages)
        {
            usage.MatId = null;
        }

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();
        return true;
    }

    private static MaterialDto MapToDto(Material material) => new()
    {
        MatId = material.MatId,
        Name = material.Name,
        Unit = material.Unit,
        UnitCost = material.UnitCost
    };
}
