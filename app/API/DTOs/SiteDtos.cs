using System;

namespace ConstruX.API.DTOs;

public class SiteDto
{
    public int SiteId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Type { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class SiteCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Type { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
