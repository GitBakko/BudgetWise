using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BudgetWise.Data.Models;

namespace BudgetWise.Data;

/// <summary>
/// DbContext che estende quello generato per supportare Identity
/// </summary>
public class IdentityBudgetWiseDbContext : IdentityDbContext<ApplicationUser>
{
    public IdentityBudgetWiseDbContext(DbContextOptions<IdentityBudgetWiseDbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        
        // Mappiamo ApplicationUser alla tabella AspNetUsers esistente
        builder.Entity<ApplicationUser>().ToTable("AspNetUsers");
    }
}
