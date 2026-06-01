using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstruX.API.Models;

[Table("maintenance_logs")]
public class MaintenanceLog
{
    [Key]
    [Column("log_id")]
    public int LogId { get; set; }

    [Column("equip_id")]
    public int? EquipId { get; set; }

    [Column("service_date")]
    public DateOnly? ServiceDate { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    // Foreign Keys / Navigation properties
    [ForeignKey(nameof(EquipId))]
    public Equipment? Equipment { get; set; }
}
