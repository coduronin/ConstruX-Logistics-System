using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;

namespace ConstruX.API.Services;

public interface IQueryService
{
    // Views
    Task<IEnumerable<SiteOverviewDto>> GetSiteOverviewAsync();
    Task<IEnumerable<SiteMaterialCostDto>> GetSiteMaterialCostAsync();
    Task<IEnumerable<EquipmentMaintenanceHistoryDto>> GetEquipmentMaintenanceHistoryAsync();
    Task<IEnumerable<IdleEquipmentDto>> GetIdleEquipmentAsync();

    // Sample Queries
    Task<IEnumerable<SiteOverviewDto>> GetWorkersBySiteAsync(string siteName);
    Task<IEnumerable<IdleEquipmentDto>> GetEquipmentUnderMaintenanceAsync();
    Task<IEnumerable<MaterialDto>> GetMaterialsSortedByCostAsync();
    Task<IEnumerable<WorkerAssignmentCountDto>> GetWorkerAssignmentCountsAsync();
    Task<IEnumerable<EquipmentFrequentMaintenanceDto>> GetEquipmentFrequentMaintenanceAsync();
}

public class QueryService : IQueryService
{
    private readonly AppDbContext _context;

    public QueryService(AppDbContext context)
    {
        _context = context;
    }

    #region Helper Methods

    private async Task<List<Dictionary<string, object>>> ExecuteSqlAsync(string sql, params (string name, object value)[] parameters)
    {
        var list = new List<Dictionary<string, object>>();
        using var command = _context.Database.GetDbConnection().CreateCommand();
        command.CommandText = sql;
        
        foreach (var (name, value) in parameters)
        {
            var parameter = command.CreateParameter();
            parameter.ParameterName = name;
            parameter.Value = value ?? DBNull.Value;
            command.Parameters.Add(parameter);
        }

        await _context.Database.OpenConnectionAsync();
        try
        {
            using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var row = new Dictionary<string, object>();
                for (int i = 0; i < reader.FieldCount; i++)
                {
                    row[reader.GetName(i)] = reader.GetValue(i);
                }
                list.Add(row);
            }
        }
        finally
        {
            await _context.Database.CloseConnectionAsync();
        }
        return list;
    }

    private static DateOnly? SafeGetDateOnly(object val)
    {
        if (val == null || val == DBNull.Value) return null;
        var str = val.ToString();
        if (string.IsNullOrWhiteSpace(str)) return null;
        
        if (str.Length >= 10 && DateOnly.TryParse(str.Substring(0, 10), out var date))
        {
            return date;
        }
        return null;
    }

    #endregion

    #region Views

    public async Task<IEnumerable<SiteOverviewDto>> GetSiteOverviewAsync()
    {
        var rows = await ExecuteSqlAsync("SELECT * FROM site_overview;");
        return rows.Select(r => new SiteOverviewDto
        {
            SiteName = Convert.ToString(r["site_name"]) ?? string.Empty,
            WorkerName = Convert.ToString(r["worker_name"]) ?? string.Empty,
            TradeSpecialty = r["trade_specialty"] == DBNull.Value ? null : Convert.ToString(r["trade_specialty"]),
            EquipmentType = r["equipment_type"] == DBNull.Value ? null : Convert.ToString(r["equipment_type"]),
            CurrentStatus = r["current_status"] == DBNull.Value ? null : Convert.ToString(r["current_status"]),
            AssignmentDate = SafeGetDateOnly(r["assignment_date"])
        });
    }

    public async Task<IEnumerable<SiteMaterialCostDto>> GetSiteMaterialCostAsync()
    {
        var rows = await ExecuteSqlAsync("SELECT * FROM site_material_cost;");
        return rows.Select(r => new SiteMaterialCostDto
        {
            SiteName = Convert.ToString(r["site_name"]) ?? string.Empty,
            TotalMaterialCost = r["total_material_cost"] == DBNull.Value ? null : Convert.ToDecimal(r["total_material_cost"])
        });
    }

    public async Task<IEnumerable<EquipmentMaintenanceHistoryDto>> GetEquipmentMaintenanceHistoryAsync()
    {
        var rows = await ExecuteSqlAsync("SELECT * FROM equipment_maintenance_history;");
        return rows.Select(r => new EquipmentMaintenanceHistoryDto
        {
            Type = r["type"] == DBNull.Value ? null : Convert.ToString(r["type"]),
            Model = r["model"] == DBNull.Value ? null : Convert.ToString(r["model"]),
            ServiceDate = SafeGetDateOnly(r["service_date"]),
            Description = r["description"] == DBNull.Value ? null : Convert.ToString(r["description"])
        });
    }

    public async Task<IEnumerable<IdleEquipmentDto>> GetIdleEquipmentAsync()
    {
        var rows = await ExecuteSqlAsync("SELECT * FROM idle_equipment;");
        return rows.Select(r => new IdleEquipmentDto
        {
            EquipId = Convert.ToInt32(r["equip_id"]),
            Type = r["type"] == DBNull.Value ? null : Convert.ToString(r["type"]),
            Model = r["model"] == DBNull.Value ? null : Convert.ToString(r["model"])
        });
    }

    #endregion

    #region Sample Queries

    public async Task<IEnumerable<SiteOverviewDto>> GetWorkersBySiteAsync(string siteName)
    {
        var sql = @"
            SELECT 
                l.name AS worker_name,
                l.trade_specialty,
                s.name AS site_name
            FROM assignments a
            JOIN labor l ON a.worker_id = l.worker_id
            JOIN sites s ON a.site_id = s.site_id
            WHERE s.name = @siteName;";

        var rows = await ExecuteSqlAsync(sql, ("@siteName", siteName));
        return rows.Select(r => new SiteOverviewDto
        {
            SiteName = Convert.ToString(r["site_name"]) ?? string.Empty,
            WorkerName = Convert.ToString(r["worker_name"]) ?? string.Empty,
            TradeSpecialty = r["trade_specialty"] == DBNull.Value ? null : Convert.ToString(r["trade_specialty"])
        });
    }

    public async Task<IEnumerable<IdleEquipmentDto>> GetEquipmentUnderMaintenanceAsync()
    {
        var sql = @"
            SELECT 
                equip_id,
                type,
                model
            FROM equipment
            WHERE current_status = 'Maintenance';";

        var rows = await ExecuteSqlAsync(sql);
        return rows.Select(r => new IdleEquipmentDto
        {
            EquipId = Convert.ToInt32(r["equip_id"]),
            Type = r["type"] == DBNull.Value ? null : Convert.ToString(r["type"]),
            Model = r["model"] == DBNull.Value ? null : Convert.ToString(r["model"])
        });
    }

    public async Task<IEnumerable<MaterialDto>> GetMaterialsSortedByCostAsync()
    {
        var sql = @"
            SELECT 
                mat_id,
                name,
                unit,
                unit_cost
            FROM materials
            ORDER BY unit_cost DESC;";

        var rows = await ExecuteSqlAsync(sql);
        return rows.Select(r => new MaterialDto
        {
            MatId = Convert.ToInt32(r["mat_id"]),
            Name = r["name"] == DBNull.Value ? null : Convert.ToString(r["name"]),
            Unit = r["unit"] == DBNull.Value ? null : Convert.ToString(r["unit"]),
            UnitCost = r["unit_cost"] == DBNull.Value ? null : Convert.ToDecimal(r["unit_cost"])
        });
    }

    public async Task<IEnumerable<WorkerAssignmentCountDto>> GetWorkerAssignmentCountsAsync()
    {
        var sql = @"
            SELECT 
                l.name AS worker_name,
                COUNT(a.assign_id) AS total_assignments
            FROM labor l
            LEFT JOIN assignments a ON l.worker_id = a.worker_id
            GROUP BY l.worker_id;";

        var rows = await ExecuteSqlAsync(sql);
        return rows.Select(r => new WorkerAssignmentCountDto
        {
            WorkerName = Convert.ToString(r["worker_name"]) ?? string.Empty,
            TotalAssignments = Convert.ToInt32(r["total_assignments"])
        });
    }

    public async Task<IEnumerable<EquipmentFrequentMaintenanceDto>> GetEquipmentFrequentMaintenanceAsync()
    {
        var sql = @"
            SELECT 
                e.type,
                e.model,
                COUNT(m.log_id) AS maintenance_count
            FROM equipment e
            JOIN maintenance_logs m ON e.equip_id = m.equip_id
            GROUP BY e.equip_id
            HAVING COUNT(m.log_id) > 1;";

        var rows = await ExecuteSqlAsync(sql);
        return rows.Select(r => new EquipmentFrequentMaintenanceDto
        {
            Type = r["type"] == DBNull.Value ? null : Convert.ToString(r["type"]),
            Model = r["model"] == DBNull.Value ? null : Convert.ToString(r["model"]),
            MaintenanceCount = Convert.ToInt32(r["maintenance_count"])
        });
    }

    #endregion
}
