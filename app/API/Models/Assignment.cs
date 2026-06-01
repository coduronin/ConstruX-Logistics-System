using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstruX.API.Models;

[Table("assignments")]
public class Assignment
{
    [Key]
    [Column("assign_id")]
    public int AssignId { get; set; }

    [Column("site_id")]
    public int? SiteId { get; set; }

    [Column("worker_id")]
    public int? WorkerId { get; set; }

    [Column("equip_id")]
    public int? EquipId { get; set; }

    [Column("assignment_date")]
    public DateOnly? AssignmentDate { get; set; }

    // Foreign Keys / Navigation properties
    [ForeignKey(nameof(SiteId))]
    public Site? Site { get; set; }

    [ForeignKey(nameof(WorkerId))]
    public Labor? Labor { get; set; }

    [ForeignKey(nameof(EquipId))]
    public Equipment? Equipment { get; set; }
}
