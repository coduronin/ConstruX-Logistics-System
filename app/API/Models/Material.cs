using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstruX.API.Models;

[Table("materials")]
public class Material
{
    [Key]
    [Column("mat_id")]
    public int MatId { get; set; }

    [Column("name")]
    public string? Name { get; set; }

    [Column("unit")]
    public string? Unit { get; set; }

    [Column("unit_cost")]
    public decimal? UnitCost { get; set; }

    // Navigation properties
    public ICollection<MaterialUsage> MaterialUsages { get; set; } = new List<MaterialUsage>();
}
