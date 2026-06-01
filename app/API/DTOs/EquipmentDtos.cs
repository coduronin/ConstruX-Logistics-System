namespace ConstruX.API.DTOs;

public class EquipmentDto
{
    public int EquipId { get; set; }
    public string? Type { get; set; }
    public string? Model { get; set; }
    public string? CurrentStatus { get; set; }
}

public class EquipmentCreateDto
{
    public string? Type { get; set; }
    public string? Model { get; set; }
    public string? CurrentStatus { get; set; }
}
