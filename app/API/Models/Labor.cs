using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConstruX.API.Models;

[Table("labor")]
public class Labor
{
    [Key]
    [Column("worker_id")]
    public int WorkerId { get; set; }

    [Required]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("trade_specialty")]
    public string? TradeSpecialty { get; set; }

    [Column("hourly_rate")]
    public decimal? HourlyRate { get; set; }

    [Column("username")]
    public string? Username { get; set; }

    [Column("password")]
    public string? Password { get; set; }

    [Column("isAdmin")]
    public bool IsAdmin { get; set; }

    // Navigation properties
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}
