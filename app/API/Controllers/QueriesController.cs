using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ConstruX.API.DTOs;
using ConstruX.API.Services;

namespace ConstruX.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QueriesController : ControllerBase
{
    private readonly IQueryService _queryService;

    public QueriesController(IQueryService queryService)
    {
        _queryService = queryService;
    }

    #region SQL Views Endpoints

    [HttpGet("views/site-overview")]
    public async Task<ActionResult<IEnumerable<SiteOverviewDto>>> GetSiteOverview()
    {
        var overview = await _queryService.GetSiteOverviewAsync();
        return Ok(overview);
    }

    [HttpGet("views/site-material-cost")]
    public async Task<ActionResult<IEnumerable<SiteMaterialCostDto>>> GetSiteMaterialCost()
    {
        var costs = await _queryService.GetSiteMaterialCostAsync();
        return Ok(costs);
    }

    [HttpGet("views/equipment-maintenance-history")]
    public async Task<ActionResult<IEnumerable<EquipmentMaintenanceHistoryDto>>> GetEquipmentMaintenanceHistory()
    {
        var history = await _queryService.GetEquipmentMaintenanceHistoryAsync();
        return Ok(history);
    }

    [HttpGet("views/idle-equipment")]
    public async Task<ActionResult<IEnumerable<IdleEquipmentDto>>> GetIdleEquipment()
    {
        var equipment = await _queryService.GetIdleEquipmentAsync();
        return Ok(equipment);
    }

    #endregion

    #region Sample Queries Endpoints

    [HttpGet("samples/workers-by-site")]
    public async Task<ActionResult<IEnumerable<SiteOverviewDto>>> GetWorkersBySite([FromQuery] string siteName = "Marmara Vadi Konakları")
    {
        var workers = await _queryService.GetWorkersBySiteAsync(siteName);
        return Ok(workers);
    }

    [HttpGet("samples/under-maintenance")]
    public async Task<ActionResult<IEnumerable<IdleEquipmentDto>>> GetEquipmentUnderMaintenance()
    {
        var equipment = await _queryService.GetEquipmentUnderMaintenanceAsync();
        return Ok(equipment);
    }

    [HttpGet("samples/materials-by-cost")]
    public async Task<ActionResult<IEnumerable<MaterialDto>>> GetMaterialsSortedByCost()
    {
        var materials = await _queryService.GetMaterialsSortedByCostAsync();
        return Ok(materials);
    }

    [HttpGet("samples/worker-assignment-counts")]
    public async Task<ActionResult<IEnumerable<WorkerAssignmentCountDto>>> GetWorkerAssignmentCounts()
    {
        var counts = await _queryService.GetWorkerAssignmentCountsAsync();
        return Ok(counts);
    }

    [HttpGet("samples/equipment-frequent-maintenance")]
    public async Task<ActionResult<IEnumerable<EquipmentFrequentMaintenanceDto>>> GetEquipmentFrequentMaintenance()
    {
        var equipment = await _queryService.GetEquipmentFrequentMaintenanceAsync();
        return Ok(equipment);
    }

    #endregion
}
