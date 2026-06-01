using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface ISiteService
{
    Task<IEnumerable<SiteDto>> GetAllAsync();
    Task<SiteDto?> GetByIdAsync(int id);
    Task<SiteDto> CreateAsync(SiteCreateDto dto);
    Task<SiteDto?> UpdateAsync(int id, SiteCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class SiteService : ISiteService
{
    private readonly AppDbContext _context;

    public SiteService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<SiteDto>> GetAllAsync()
    {
        var sites = await _context.Sites.ToListAsync();
        return sites.Select(MapToDto);
    }

    public async Task<SiteDto?> GetByIdAsync(int id)
    {
        var site = await _context.Sites.FindAsync(id);
        return site == null ? null : MapToDto(site);
    }

    public async Task<SiteDto> CreateAsync(SiteCreateDto dto)
    {
        var site = new Site
        {
            Name = dto.Name,
            Location = dto.Location,
            Type = dto.Type,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate
        };

        _context.Sites.Add(site);
        await _context.SaveChangesAsync();

        return MapToDto(site);
    }

    public async Task<SiteDto?> UpdateAsync(int id, SiteCreateDto dto)
    {
        var site = await _context.Sites.FindAsync(id);
        if (site == null) return null;

        site.Name = dto.Name;
        site.Location = dto.Location;
        site.Type = dto.Type;
        site.StartDate = dto.StartDate;
        site.EndDate = dto.EndDate;

        await _context.SaveChangesAsync();
        return MapToDto(site);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var site = await _context.Sites.FindAsync(id);
        if (site == null) return false;

        // Set SiteId to null for all assignments referencing this site to avoid foreign key violations
        var assignments = await _context.Assignments.Where(a => a.SiteId == id).ToListAsync();
        foreach (var assignment in assignments)
        {
            assignment.SiteId = null;
        }

        // Set SiteId to null for all material usages referencing this site to avoid foreign key violations
        var usages = await _context.MaterialUsages.Where(mu => mu.SiteId == id).ToListAsync();
        foreach (var usage in usages)
        {
            usage.SiteId = null;
        }

        _context.Sites.Remove(site);
        await _context.SaveChangesAsync();
        return true;
    }

    private static SiteDto MapToDto(Site site) => new()
    {
        SiteId = site.SiteId,
        Name = site.Name,
        Location = site.Location,
        Type = site.Type,
        StartDate = site.StartDate,
        EndDate = site.EndDate
    };
}
