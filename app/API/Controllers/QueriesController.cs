using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConstruX.API.Data;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QueriesController : ControllerBase
{
    private readonly IQueryService _queryService;
    private readonly AppDbContext _context;

    public QueriesController(IQueryService queryService, AppDbContext context)
    {
        _queryService = queryService;
        _context = context;
    }

    #region SQL Views Endpoints

    [HttpGet("views/site-overview")]
    public async Task<ActionResult<IEnumerable<SiteOverviewDto>>> GetSiteOverview()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var overview = await _queryService.GetSiteOverviewAsync();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var workerName = await _context.Labor
                    .Where(l => l.WorkerId == callerId)
                    .Select(l => l.Name)
                    .FirstOrDefaultAsync();

                if (workerName != null)
                {
                    overview = overview.Where(o => o.WorkerName.Equals(workerName, System.StringComparison.OrdinalIgnoreCase));
                }
                else
                {
                    return Forbid();
                }
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(overview);
    }

    [HttpGet("views/site-material-cost")]
    public async Task<ActionResult<IEnumerable<SiteMaterialCostDto>>> GetSiteMaterialCost()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var costs = await _queryService.GetSiteMaterialCostAsync();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var assignedSiteNames = await _context.Assignments
                    .Where(a => a.WorkerId == callerId && a.Site != null)
                    .Select(a => a.Site!.Name)
                    .Distinct()
                    .ToListAsync();

                costs = costs.Where(c => assignedSiteNames.Contains(c.SiteName));
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(costs);
    }

    [HttpGet("views/equipment-maintenance-history")]
    public async Task<ActionResult<IEnumerable<EquipmentMaintenanceHistoryDto>>> GetEquipmentMaintenanceHistory()
    {
        var isCallerAdmin = User.IsInRole("Admin");
        var history = await _queryService.GetEquipmentMaintenanceHistoryAsync();

        if (!isCallerAdmin)
        {
            var callerIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(callerIdStr, out int callerId))
            {
                var assignedEquipModels = await _context.Assignments
                    .Where(a => a.WorkerId == callerId && a.Equipment != null)
                    .Select(a => a.Equipment!.Model)
                    .Distinct()
                    .ToListAsync();

                history = history.Where(h => assignedEquipModels.Contains(h.Model));
            }
            else
            {
                return Forbid();
            }
        }

        return Ok(history);
    }

    [HttpGet("views/idle-equipment")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<IdleEquipmentDto>>> GetIdleEquipment()
    {
        var equipment = await _queryService.GetIdleEquipmentAsync();
        return Ok(equipment);
    }

    #endregion

    #region Sample Queries Endpoints

    [HttpGet("samples/workers-by-site")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<SiteOverviewDto>>> GetWorkersBySite([FromQuery] string siteName = "Marmara Vadi Konakları")
    {
        var workers = await _queryService.GetWorkersBySiteAsync(siteName);
        return Ok(workers);
    }

    [HttpGet("samples/under-maintenance")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<IdleEquipmentDto>>> GetEquipmentUnderMaintenance()
    {
        var equipment = await _queryService.GetEquipmentUnderMaintenanceAsync();
        return Ok(equipment);
    }

    [HttpGet("samples/materials-by-cost")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<MaterialDto>>> GetMaterialsSortedByCost()
    {
        var materials = await _queryService.GetMaterialsSortedByCostAsync();
        return Ok(materials);
    }

    [HttpGet("samples/worker-assignment-counts")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<WorkerAssignmentCountDto>>> GetWorkerAssignmentCounts()
    {
        var counts = await _queryService.GetWorkerAssignmentCountsAsync();
        return Ok(counts);
    }

    [HttpGet("samples/equipment-frequent-maintenance")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<EquipmentFrequentMaintenanceDto>>> GetEquipmentFrequentMaintenance()
    {
        var equipment = await _queryService.GetEquipmentFrequentMaintenanceAsync();
        return Ok(equipment);
    }

    #endregion
}
