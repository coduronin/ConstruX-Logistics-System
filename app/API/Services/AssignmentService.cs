using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface IAssignmentService
{
    Task<IEnumerable<AssignmentDto>> GetAllAsync();
    Task<AssignmentDto?> GetByIdAsync(int id);
    Task<AssignmentDto> CreateAsync(AssignmentCreateDto dto);
    Task<AssignmentDto?> UpdateAsync(int id, AssignmentCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _context;

    public AssignmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<AssignmentDto>> GetAllAsync()
    {
        var assignments = await _context.Assignments
            .Include(a => a.Site)
            .Include(a => a.Labor)
            .Include(a => a.Equipment)
            .ToListAsync();
            
        return assignments.Select(MapToDto);
    }

    public async Task<AssignmentDto?> GetByIdAsync(int id)
    {
        var assignment = await _context.Assignments
            .Include(a => a.Site)
            .Include(a => a.Labor)
            .Include(a => a.Equipment)
            .FirstOrDefaultAsync(a => a.AssignId == id);
            
        return assignment == null ? null : MapToDto(assignment);
    }

    public async Task<AssignmentDto> CreateAsync(AssignmentCreateDto dto)
    {
        var assignment = new Assignment
        {
            SiteId = dto.SiteId,
            WorkerId = dto.WorkerId,
            EquipId = dto.EquipId,
            AssignmentDate = dto.AssignmentDate
        };

        _context.Assignments.Add(assignment);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(assignment.AssignId) ?? MapToDto(assignment);
    }

    public async Task<AssignmentDto?> UpdateAsync(int id, AssignmentCreateDto dto)
    {
        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return null;

        assignment.SiteId = dto.SiteId;
        assignment.WorkerId = dto.WorkerId;
        assignment.EquipId = dto.EquipId;
        assignment.AssignmentDate = dto.AssignmentDate;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(assignment.AssignId) ?? MapToDto(assignment);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var assignment = await _context.Assignments.FindAsync(id);
        if (assignment == null) return false;

        _context.Assignments.Remove(assignment);
        await _context.SaveChangesAsync();
        return true;
    }

    private static AssignmentDto MapToDto(Assignment assignment) => new()
    {
        AssignId = assignment.AssignId,
        SiteId = assignment.SiteId,
        WorkerId = assignment.WorkerId,
        EquipId = assignment.EquipId,
        AssignmentDate = assignment.AssignmentDate,
        SiteName = assignment.Site?.Name,
        WorkerName = assignment.Labor?.Name,
        EquipmentModel = assignment.Equipment?.Model
    };
}
