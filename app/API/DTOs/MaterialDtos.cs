namespace ConstruX.API.DTOs;

public class MaterialDto
{
    public int MatId { get; set; }
    public string? Name { get; set; }
    public string? Unit { get; set; }
    public decimal? UnitCost { get; set; }
}

public class MaterialCreateDto
{
    public string? Name { get; set; }
    public string? Unit { get; set; }
    public decimal? UnitCost { get; set; }
}
