using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Models;

namespace ConstruX.API.Services;

public interface IMaintenanceLogService
{
    Task<IEnumerable<MaintenanceLogDto>> GetAllAsync();
    Task<MaintenanceLogDto?> GetByIdAsync(int id);
    Task<MaintenanceLogDto> CreateAsync(MaintenanceLogCreateDto dto);
    Task<MaintenanceLogDto?> UpdateAsync(int id, MaintenanceLogCreateDto dto);
    Task<bool> DeleteAsync(int id);
}

public class MaintenanceLogService : IMaintenanceLogService
{
    private readonly AppDbContext _context;

    public MaintenanceLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MaintenanceLogDto>> GetAllAsync()
    {
        var logs = await _context.MaintenanceLogs
            .Include(ml => ml.Equipment)
            .ToListAsync();
            
        return logs.Select(MapToDto);
    }

    public async Task<MaintenanceLogDto?> GetByIdAsync(int id)
    {
        var log = await _context.MaintenanceLogs
            .Include(ml => ml.Equipment)
            .FirstOrDefaultAsync(ml => ml.LogId == id);
            
        return log == null ? null : MapToDto(log);
    }

    public async Task<MaintenanceLogDto> CreateAsync(MaintenanceLogCreateDto dto)
    {
        var log = new MaintenanceLog
        {
            EquipId = dto.EquipId,
            ServiceDate = dto.ServiceDate,
            Description = dto.Description
        };

        _context.MaintenanceLogs.Add(log);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(log.LogId) ?? MapToDto(log);
    }

    public async Task<MaintenanceLogDto?> UpdateAsync(int id, MaintenanceLogCreateDto dto)
    {
        var log = await _context.MaintenanceLogs.FindAsync(id);
        if (log == null) return null;

        log.EquipId = dto.EquipId;
        log.ServiceDate = dto.ServiceDate;
        log.Description = dto.Description;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(log.LogId) ?? MapToDto(log);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var log = await _context.MaintenanceLogs.FindAsync(id);
        if (log == null) return false;

        _context.MaintenanceLogs.Remove(log);
        await _context.SaveChangesAsync();
        return true;
    }

    private static MaintenanceLogDto MapToDto(MaintenanceLog log) => new()
    {
        LogId = log.LogId,
        EquipId = log.EquipId,
        ServiceDate = log.ServiceDate,
        Description = log.Description,
        EquipmentModel = log.Equipment?.Model,
        EquipmentType = log.Equipment?.Type
    };
}
