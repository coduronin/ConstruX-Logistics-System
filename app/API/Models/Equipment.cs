using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstruX.API.Models;

[Table("equipment")]
public class Equipment
{
    [Key]
    [Column("equip_id")]
    public int EquipId { get; set; }

    [Column("type")]
    public string? Type { get; set; }

    [Column("model")]
    public string? Model { get; set; }

    [Column("current_status")]
    public string? CurrentStatus { get; set; }

    // Navigation properties
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
    public ICollection<MaintenanceLog> MaintenanceLogs { get; set; } = new List<MaintenanceLog>();
}
