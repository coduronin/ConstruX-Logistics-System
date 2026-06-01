using System;

namespace ConstruX.API.DTOs;

public class MaintenanceLogDto
{
    public int LogId { get; set; }
    public int? EquipId { get; set; }
    public DateOnly? ServiceDate { get; set; }
    public string? Description { get; set; }

    public string? EquipmentModel { get; set; }
    public string? EquipmentType { get; set; }
}

public class MaintenanceLogCreateDto
{
    public int? EquipId { get; set; }
    public DateOnly? ServiceDate { get; set; }
    public string? Description { get; set; }
}
