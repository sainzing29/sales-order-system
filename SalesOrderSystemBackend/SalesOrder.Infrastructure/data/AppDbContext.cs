using Microsoft.EntityFrameworkCore;
using SalesOrder.Domain.Entities;

namespace SalesOrder.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<Role> Roles { get; set; }

    public DbSet<Vendor> Vendors { get; set; }

    public DbSet<Items> Items { get; set; }

    public DbSet<SalesOrders> SalesOrder { get; set; }

    public DbSet<SalesOrderItems> SalesOrderItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SalesOrderItems>()
            .HasOne(x => x.SalesOrder)
            .WithMany(x => x.SalesOrderItems)
            .HasForeignKey(x => x.SalesOrderId);

        modelBuilder.Entity<SalesOrderItems>()
            .HasOne(x => x.Item)
            .WithMany(x => x.SalesOrderItems)
            .HasForeignKey(x => x.ItemId);

        modelBuilder.Entity<User>()
            .HasOne(x => x.Role)
            .WithMany(x => x.Users)
            .HasForeignKey(x => x.RoleId);

        modelBuilder.Entity<SalesOrders>()
            .ToTable("SalesOrders");

        modelBuilder.Entity<SalesOrders>()
            .HasOne(x => x.Vendor)
            .WithMany(x => x.SalesOrders)
            .HasForeignKey(x => x.VendorId);

        modelBuilder.Entity<Items>()
            .Property(x => x.Price)
            .HasPrecision(18, 2);
    }
}