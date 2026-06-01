using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface IMaterialUsageService
{
    Task<IEnumerable<MaterialUsageDto>> GetAllAsync();
    Task<MaterialUsageDto?> GetByIdAsync(int id);
    Task<MaterialUsageDto> CreateAsync(MaterialUsageCreateDto dto);
    Task<MaterialUsageDto?> UpdateAsync(int id, MaterialUsageCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class MaterialUsageService : IMaterialUsageService
{
    private readonly AppDbContext _context;

    public MaterialUsageService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MaterialUsageDto>> GetAllAsync()
    {
        var usages = await _context.MaterialUsages
            .Include(mu => mu.Site)
            .Include(mu => mu.Material)
            .ToListAsync();
            
        return usages.Select(MapToDto);
    }

    public async Task<MaterialUsageDto?> GetByIdAsync(int id)
    {
        var usage = await _context.MaterialUsages
            .Include(mu => mu.Site)
            .Include(mu => mu.Material)
            .FirstOrDefaultAsync(mu => mu.UsageId == id);
            
        return usage == null ? null : MapToDto(usage);
    }

    public async Task<MaterialUsageDto> CreateAsync(MaterialUsageCreateDto dto)
    {
        var usage = new MaterialUsage
        {
            SiteId = dto.SiteId,
            MatId = dto.MatId,
            QuantityUsed = dto.QuantityUsed,
            UsageDate = dto.UsageDate
        };

        _context.MaterialUsages.Add(usage);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(usage.UsageId) ?? MapToDto(usage);
    }

    public async Task<MaterialUsageDto?> UpdateAsync(int id, MaterialUsageCreateDto dto)
    {
        var usage = await _context.MaterialUsages.FindAsync(id);
        if (usage == null) return null;

        usage.SiteId = dto.SiteId;
        usage.MatId = dto.MatId;
        usage.QuantityUsed = dto.QuantityUsed;
        usage.UsageDate = dto.UsageDate;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(usage.UsageId) ?? MapToDto(usage);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var usage = await _context.MaterialUsages.FindAsync(id);
        if (usage == null) return false;

        _context.MaterialUsages.Remove(usage);
        await _context.SaveChangesAsync();
        return true;
    }

    private static MaterialUsageDto MapToDto(MaterialUsage usage) => new()
    {
        UsageId = usage.UsageId,
        SiteId = usage.SiteId,
        MatId = usage.MatId,
        QuantityUsed = usage.QuantityUsed,
        UsageDate = usage.UsageDate,
        SiteName = usage.Site?.Name,
        MaterialName = usage.Material?.Name
    };
}
