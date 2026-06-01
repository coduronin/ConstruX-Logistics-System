using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstruX.API.Models;

[Table("sites")]
public class Site
{
    [Key]
    [Column("site_id")]
    public int SiteId { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("location")]
    public string? Location { get; set; }

    [Column("type")]
    public string? Type { get; set; }

    [Column("start_date")]
    public DateOnly? StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    // Navigation properties
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<MaterialUsage> MaterialUsages { get; set; } = new List<MaterialUsage>();
}
