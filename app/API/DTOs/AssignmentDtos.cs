using System;

namespace ConstruX.API.DTOs;

public class AssignmentDto
{
    public int AssignId { get; set; }
    public int? SiteId { get; set; }
    public int? WorkerId { get; set; }
    public int? EquipId { get; set; }
    public DateOnly? AssignmentDate { get; set; }
    
    // Detailed name properties for easy consumption
    public string? SiteName { get; set; }
    public string? WorkerName { get; set; }
    public string? EquipmentModel { get; set; }
}

public class AssignmentCreateDto
{
    public int? SiteId { get; set; }
    public int? WorkerId { get; set; }
    public int? EquipId { get; set; }
    public DateOnly? AssignmentDate { get; set; }
}
