using System;
using System.Collections.Generic;
using BudgetWise.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace BudgetWise.Data;

public partial class BudgetWiseDbContext : DbContext
{
    public BudgetWiseDbContext()
    {
    }

    public BudgetWiseDbContext(DbContextOptions<BudgetWiseDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Account> Accounts { get; set; }

    public virtual DbSet<AspNetRole> AspNetRoles { get; set; }

    public virtual DbSet<AspNetRoleClaim> AspNetRoleClaims { get; set; }

    public virtual DbSet<AspNetUser> AspNetUsers { get; set; }

    public virtual DbSet<AspNetUserClaim> AspNetUserClaims { get; set; }

    public virtual DbSet<AspNetUserLogin> AspNetUserLogins { get; set; }

    public virtual DbSet<AspNetUserToken> AspNetUserTokens { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<BalanceSnapshot> BalanceSnapshots { get; set; }

    public virtual DbSet<Brand> Brands { get; set; }

    public virtual DbSet<Budget> Budgets { get; set; }

    public virtual DbSet<Category> Categories { get; set; }

    public virtual DbSet<DefaultCategory> DefaultCategories { get; set; }

    public virtual DbSet<ImageFile> ImageFiles { get; set; }

    public virtual DbSet<Notification> Notifications { get; set; }

    public virtual DbSet<PurgeLog> PurgeLogs { get; set; }

    public virtual DbSet<Transaction> Transactions { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=192.168.3.243,1433;Database=BudgetWise;User Id=sa;Password=G@7kRz!1eTq#Xb9L;TrustServerCertificate=true;Encrypt=false;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Accounts__3214EC0760359886");

            entity.HasIndex(e => e.CreatedAt, "IX_Accounts_CreatedAt");

            entity.HasIndex(e => e.IconId, "IX_Accounts_IconId");

            entity.HasIndex(e => e.UserId, "IX_Accounts_UserId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.BalanceStartDate).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.Name).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.Accounts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_Accounts_AspNetUsers");
        });

        modelBuilder.Entity<AspNetRole>(entity =>
        {
            entity.HasIndex(e => e.NormalizedName, "RoleNameIndex")
                .IsUnique()
                .HasFilter("([NormalizedName] IS NOT NULL)");

            entity.Property(e => e.Name).HasMaxLength(256);
            entity.Property(e => e.NormalizedName).HasMaxLength(256);
        });

        modelBuilder.Entity<AspNetRoleClaim>(entity =>
        {
            entity.HasIndex(e => e.RoleId, "IX_AspNetRoleClaims_RoleId");

            entity.HasOne(d => d.Role).WithMany(p => p.AspNetRoleClaims).HasForeignKey(d => d.RoleId);
        });

        modelBuilder.Entity<AspNetUser>(entity =>
        {
            entity.HasIndex(e => e.NormalizedEmail, "EmailIndex");

            entity.HasIndex(e => e.DefaultAccountId, "IX_AspNetUsers_DefaultAccountId");

            entity.HasIndex(e => e.ManagedBy, "IX_AspNetUsers_ManagedBy");

            entity.HasIndex(e => e.PhotoId, "IX_AspNetUsers_PhotoId");

            entity.HasIndex(e => e.Role, "IX_AspNetUsers_Role");

            entity.HasIndex(e => e.NormalizedUserName, "UserNameIndex")
                .IsUnique()
                .HasFilter("([NormalizedUserName] IS NOT NULL)");

            entity.Property(e => e.Address).HasMaxLength(255);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.NormalizedEmail).HasMaxLength(256);
            entity.Property(e => e.NormalizedUserName).HasMaxLength(256);
            entity.Property(e => e.Province).HasMaxLength(5);
            entity.Property(e => e.Role)
                .HasMaxLength(20)
                .HasDefaultValue("user");
            entity.Property(e => e.UserName).HasMaxLength(256);
            entity.Property(e => e.ZipCode).HasMaxLength(10);

            entity.HasOne(d => d.DefaultAccount).WithMany(p => p.AspNetUsers)
                .HasForeignKey(d => d.DefaultAccountId)
                .HasConstraintName("FK_AspNetUsers_DefaultAccount");

            entity.HasMany(d => d.Roles).WithMany(p => p.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "AspNetUserRole",
                    r => r.HasOne<AspNetRole>().WithMany().HasForeignKey("RoleId"),
                    l => l.HasOne<AspNetUser>().WithMany().HasForeignKey("UserId"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId");
                        j.ToTable("AspNetUserRoles");
                        j.HasIndex(new[] { "RoleId" }, "IX_AspNetUserRoles_RoleId");
                    });
        });

        modelBuilder.Entity<AspNetUserClaim>(entity =>
        {
            entity.HasIndex(e => e.UserId, "IX_AspNetUserClaims_UserId");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserClaims).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserLogin>(entity =>
        {
            entity.HasKey(e => new { e.LoginProvider, e.ProviderKey });

            entity.HasIndex(e => e.UserId, "IX_AspNetUserLogins_UserId");

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserLogins).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AspNetUserToken>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.LoginProvider, e.Name });

            entity.HasOne(d => d.User).WithMany(p => p.AspNetUserTokens).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__AuditLog__3214EC07B1332258");

            entity.HasIndex(e => e.Action, "IX_AuditLogs_Action");

            entity.HasIndex(e => e.EntityId, "IX_AuditLogs_EntityId");

            entity.HasIndex(e => e.EntityType, "IX_AuditLogs_EntityType");

            entity.HasIndex(e => new { e.EntityType, e.EntityId }, "IX_AuditLogs_EntityType_EntityId");

            entity.HasIndex(e => e.OnWhomUid, "IX_AuditLogs_OnWhomUid");

            entity.HasIndex(e => new { e.OnWhomUid, e.Timestamp }, "IX_AuditLogs_OnWhomUid_Timestamp").IsDescending(false, true);

            entity.HasIndex(e => e.RestoredAt, "IX_AuditLogs_RestoredAt");

            entity.HasIndex(e => e.Timestamp, "IX_AuditLogs_Timestamp").IsDescending();

            entity.HasIndex(e => e.WhoUid, "IX_AuditLogs_WhoUid");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Action).HasMaxLength(20);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.EntityType).HasMaxLength(50);
            entity.Property(e => e.OnWhomDisplayName).HasMaxLength(100);
            entity.Property(e => e.RestoredByDisplayName).HasMaxLength(100);
            entity.Property(e => e.RestoredByUid).HasMaxLength(450);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.WhoEmail).HasMaxLength(256);
            entity.Property(e => e.WhoRole).HasMaxLength(20);
        });

        modelBuilder.Entity<BalanceSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__BalanceS__3214EC073701DCEE");

            entity.HasIndex(e => e.AccountId, "IX_BalanceSnapshots_AccountId");

            entity.HasIndex(e => new { e.AccountId, e.Date }, "IX_BalanceSnapshots_AccountId_Date").IsDescending(false, true);

            entity.HasIndex(e => e.Date, "IX_BalanceSnapshots_Date");

            entity.HasIndex(e => e.UserId, "IX_BalanceSnapshots_UserId");

            entity.HasIndex(e => new { e.AccountId, e.Date }, "UK_BalanceSnapshots_AccountId_Date").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Balance).HasColumnType("decimal(18, 2)");

            entity.HasOne(d => d.Account).WithMany(p => p.BalanceSnapshots)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BalanceSnapshots_Accounts");

            entity.HasOne(d => d.User).WithMany(p => p.BalanceSnapshots)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_BalanceSnapshots_AspNetUsers");
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Brands__3214EC07CF5E167D");

            entity.HasIndex(e => e.CreatedByUid, "IX_Brands_CreatedByUid");

            entity.HasIndex(e => e.Domain, "IX_Brands_Domain");

            entity.HasIndex(e => e.IconId, "IX_Brands_IconId");

            entity.HasIndex(e => e.Name, "IX_Brands_Name");

            entity.HasIndex(e => e.NameLowercase, "IX_Brands_NameLowercase");

            entity.HasIndex(e => e.NameLowercase, "UK_Brands_NameLowercase").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.CreatedByDisplayName).HasMaxLength(100);
            entity.Property(e => e.Domain).HasMaxLength(255);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.NameLowercase).HasMaxLength(255);
        });

        modelBuilder.Entity<Budget>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Budgets__3214EC07D63BCBF0");

            entity.HasIndex(e => e.EndDate, "IX_Budgets_EndDate");

            entity.HasIndex(e => e.IsActive, "IX_Budgets_IsActive");

            entity.HasIndex(e => e.Periodicity, "IX_Budgets_Periodicity");

            entity.HasIndex(e => e.StartDate, "IX_Budgets_StartDate");

            entity.HasIndex(e => e.UserId, "IX_Budgets_UserId");

            entity.HasIndex(e => new { e.UserId, e.IsActive }, "IX_Budgets_UserId_IsActive");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.Currency)
                .HasMaxLength(3)
                .HasDefaultValue("EUR");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Periodicity).HasMaxLength(20);
            entity.Property(e => e.ProgressPercentage).HasColumnType("decimal(5, 2)");
            entity.Property(e => e.SpentAmount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetimeoffset())");

            entity.HasOne(d => d.User).WithMany(p => p.Budgets)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Budgets_AspNetUsers");
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Categori__3214EC0759FB4A6D");

            entity.HasIndex(e => e.Name, "IX_Categories_Name");

            entity.HasIndex(e => e.Type, "IX_Categories_Type");

            entity.HasIndex(e => e.UserId, "IX_Categories_UserId");

            entity.HasIndex(e => new { e.UserId, e.Type }, "IX_Categories_UserId_Type");

            entity.HasIndex(e => new { e.UserId, e.Name }, "UK_Categories_UserId_Name").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.Icon).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Type).HasMaxLength(20);

            entity.HasOne(d => d.User).WithMany(p => p.Categories)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Categories_AspNetUsers");
        });

        modelBuilder.Entity<DefaultCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__DefaultC__3214EC07339C2061");

            entity.HasIndex(e => e.CreatedByUid, "IX_DefaultCategories_CreatedByUid");

            entity.HasIndex(e => e.Name, "IX_DefaultCategories_Name");

            entity.HasIndex(e => e.Type, "IX_DefaultCategories_Type");

            entity.HasIndex(e => e.Name, "UK_DefaultCategories_Name").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Color).HasMaxLength(7);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.CreatedByDisplayName).HasMaxLength(100);
            entity.Property(e => e.Icon).HasMaxLength(50);
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Type).HasMaxLength(20);
        });

        modelBuilder.Entity<ImageFile>(entity =>
        {
            entity.HasIndex(e => e.IsAnalyzed, "IX_ImageFiles_IsAnalyzed");

            entity.HasIndex(e => e.UniqueName, "IX_ImageFiles_UniqueName").IsUnique();

            entity.HasIndex(e => e.UploadDate, "IX_ImageFiles_UploadDate");

            entity.HasIndex(e => e.UserId, "IX_ImageFiles_UserId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ContentType).HasMaxLength(100);
            entity.Property(e => e.OriginalName).HasMaxLength(255);
            entity.Property(e => e.StoragePath).HasMaxLength(500);
            entity.Property(e => e.UniqueName).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.ImageFiles).HasForeignKey(d => d.UserId);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Notifica__3214EC07162B2B2A");

            entity.HasIndex(e => e.CreatedAt, "IX_Notifications_CreatedAt").IsDescending();

            entity.HasIndex(e => e.IsRead, "IX_Notifications_IsRead");

            entity.HasIndex(e => e.RelatedEntityType, "IX_Notifications_RelatedEntityType");

            entity.HasIndex(e => e.UserId, "IX_Notifications_UserId");

            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_Notifications_UserId_CreatedAt").IsDescending(false, true);

            entity.HasIndex(e => new { e.UserId, e.IsRead }, "IX_Notifications_UserId_IsRead");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.RelatedEntityId).HasMaxLength(450);
            entity.Property(e => e.RelatedEntityType).HasMaxLength(50);
            entity.Property(e => e.Title).HasMaxLength(255);

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Notifications_AspNetUsers");
        });

        modelBuilder.Entity<PurgeLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PurgeLog__3214EC07E08BE9FA");

            entity.HasIndex(e => e.PurgedByUid, "IX_PurgeLogs_PurgedByUid");

            entity.HasIndex(e => e.Timestamp, "IX_PurgeLogs_Timestamp").IsDescending();

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.PurgedByDisplayName).HasMaxLength(100);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("(sysdatetimeoffset())");
        });

        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Transact__3214EC0779DACA90");

            entity.HasIndex(e => e.AccountId, "IX_Transactions_AccountId");

            entity.HasIndex(e => new { e.AccountId, e.Date }, "IX_Transactions_AccountId_Date").IsDescending(false, true);

            entity.HasIndex(e => e.Category, "IX_Transactions_Category");

            entity.HasIndex(e => e.CreatedAt, "IX_Transactions_CreatedAt");

            entity.HasIndex(e => e.Date, "IX_Transactions_Date");

            entity.HasIndex(e => e.Type, "IX_Transactions_Type");

            entity.HasIndex(e => e.UserId, "IX_Transactions_UserId");

            entity.HasIndex(e => new { e.UserId, e.Date }, "IX_Transactions_UserId_Date").IsDescending(false, true);

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.Amount).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Category).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetimeoffset())");
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Type).HasMaxLength(20);

            entity.HasOne(d => d.Account).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Transactions_Accounts");

            entity.HasOne(d => d.User).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Transactions_AspNetUsers");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
