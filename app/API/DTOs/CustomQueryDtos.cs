using System;

namespace ConstruX.API.DTOs;

public class SiteOverviewDto
{
    public string SiteName { get; set; } = string.Empty;
    public string WorkerName { get; set; } = string.Empty;
    public string? TradeSpecialty { get; set; }
    public string? EquipmentType { get; set; }
    public string? CurrentStatus { get; set; }
    public DateOnly? AssignmentDate { get; set; }
}

public class SiteMaterialCostDto
{
    public string SiteName { get; set; } = string.Empty;
    public decimal? TotalMaterialCost { get; set; }
}

public class EquipmentMaintenanceHistoryDto
{
    public string? Type { get; set; }
    public string? Model { get; set; }
    public DateOnly? ServiceDate { get; set; }
    public string? Description { get; set; }
}

public class IdleEquipmentDto
{
    public int EquipId { get; set; }
    public string? Type { get; set; }
    public string? Model { get; set; }
}

public class WorkerAssignmentCountDto
{
    public string WorkerName { get; set; } = string.Empty;
    public int TotalAssignments { get; set; }
}

public class EquipmentFrequentMaintenanceDto
{
    public string? Type { get; set; }
    public string? Model { get; set; }
    public int MaintenanceCount { get; set; }
}
