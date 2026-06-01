using System;

namespace ConstruX.API.DTOs;

public class MaterialUsageDto
{
    public int UsageId { get; set; }
    public int? SiteId { get; set; }
    public int? MatId { get; set; }
    public decimal? QuantityUsed { get; set; }
    public DateOnly? UsageDate { get; set; }

    public string? SiteName { get; set; }
    public string? MaterialName { get; set; }
}

public class MaterialUsageCreateDto
{
    public int? SiteId { get; set; }
    public int? MatId { get; set; }
    public decimal? QuantityUsed { get; set; }
    public DateOnly? UsageDate { get; set; }
}
