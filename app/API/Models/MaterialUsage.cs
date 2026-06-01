using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstruX.API.Models;

[Table("material_usage")]
public class MaterialUsage
{
    [Key]
    [Column("usage_id")]
    public int UsageId { get; set; }

    [Column("site_id")]
    public int? SiteId { get; set; }

    [Column("mat_id")]
    public int? MatId { get; set; }

    [Column("quantity_used")]
    public decimal? QuantityUsed { get; set; }

    [Column("usage_date")]
    public DateOnly? UsageDate { get; set; }

    // Foreign Keys / Navigation properties
    [ForeignKey(nameof(SiteId))]
    public Site? Site { get; set; }

    [ForeignKey(nameof(MatId))]
    public Material? Material { get; set; }
}
