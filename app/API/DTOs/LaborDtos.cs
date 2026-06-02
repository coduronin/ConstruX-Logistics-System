namespace ConstruX.API.DTOs;

public class LaborDto
{
    public int WorkerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? TradeSpecialty { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? Username { get; set; }
    public bool IsAdmin { get; set; }
}

public class LaborCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? TradeSpecialty { get; set; }
    public decimal? HourlyRate { get; set; }
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool IsAdmin { get; set; }
}
