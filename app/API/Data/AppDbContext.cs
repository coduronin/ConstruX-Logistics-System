using Microsoft.EntityFrameworkCore;
using ConstruX.API.Models;

namespace ConstruX.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Site> Sites { get; set; } = null!;
    public DbSet<Labor> Labor { get; set; } = null!;
    public DbSet<Equipment> Equipment { get; set; } = null!;
    public DbSet<Material> Materials { get; set; } = null!;
    public DbSet<Assignment> Assignments { get; set; } = null!;
    public DbSet<MaterialUsage> MaterialUsages { get; set; } = null!;
    public DbSet<MaintenanceLog> MaintenanceLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure cascade delete for MaintenanceLog when its Equipment is deleted
        modelBuilder.Entity<MaintenanceLog>()
            .HasOne(ml => ml.Equipment)
            .WithMany(e => e.MaintenanceLogs)
            .HasForeignKey(ml => ml.EquipId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configure Assignment relationships
        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Site)
            .WithMany(s => s.Assignments)
            .HasForeignKey(a => a.SiteId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Labor)
            .WithMany(l => l.Assignments)
            .HasForeignKey(a => a.WorkerId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Assignment>()
            .HasOne(a => a.Equipment)
            .WithMany(e => e.Assignments)
            .HasForeignKey(a => a.EquipId)
            .OnDelete(DeleteBehavior.SetNull);

        // Configure MaterialUsage relationships
        modelBuilder.Entity<MaterialUsage>()
            .HasOne(mu => mu.Site)
            .WithMany(s => s.MaterialUsages)
            .HasForeignKey(mu => mu.SiteId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MaterialUsage>()
            .HasOne(mu => mu.Material)
            .WithMany(m => m.MaterialUsages)
            .HasForeignKey(mu => mu.MatId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
