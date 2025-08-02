using Microsoft.AspNetCore.Identity;
using BudgetWise.Data.Models;

namespace BudgetWise.Data.Entities;

/// <summary>
/// Wrapper per AspNetUser che implementa IdentityUser per l'integrazione con ASP.NET Core Identity
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;
    public string Role { get; set; } = "user";
    public string? DisplayName { get; set; }
    public Guid? PhotoId { get; set; }
    public Guid? DefaultAccountId { get; set; }
    public DateTimeOffset? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? ZipCode { get; set; }
    public string? Province { get; set; }
    public string? ManagedUserIds { get; set; }
    public string? ManagedBy { get; set; }

    public static ApplicationUser FromAspNetUser(AspNetUser aspNetUser)
    {
        return new ApplicationUser
        {
            Id = aspNetUser.Id,
            UserName = aspNetUser.UserName,
            NormalizedUserName = aspNetUser.NormalizedUserName,
            Email = aspNetUser.Email,
            NormalizedEmail = aspNetUser.NormalizedEmail,
            EmailConfirmed = aspNetUser.EmailConfirmed,
            PasswordHash = aspNetUser.PasswordHash,
            SecurityStamp = aspNetUser.SecurityStamp,
            ConcurrencyStamp = aspNetUser.ConcurrencyStamp,
            PhoneNumber = aspNetUser.PhoneNumber,
            PhoneNumberConfirmed = aspNetUser.PhoneNumberConfirmed,
            TwoFactorEnabled = aspNetUser.TwoFactorEnabled,
            LockoutEnd = aspNetUser.LockoutEnd,
            LockoutEnabled = aspNetUser.LockoutEnabled,
            AccessFailedCount = aspNetUser.AccessFailedCount,
            FullName = aspNetUser.FullName,
            CreatedAt = aspNetUser.CreatedAt,
            UpdatedAt = aspNetUser.UpdatedAt,
            IsActive = aspNetUser.IsActive,
            Role = aspNetUser.Role ?? "user",
            DisplayName = aspNetUser.DisplayName,
            PhotoId = aspNetUser.PhotoId,
            DefaultAccountId = aspNetUser.DefaultAccountId,
            DateOfBirth = aspNetUser.DateOfBirth,
            Address = aspNetUser.Address,
            City = aspNetUser.City,
            ZipCode = aspNetUser.ZipCode,
            Province = aspNetUser.Province,
            ManagedUserIds = aspNetUser.ManagedUserIds,
            ManagedBy = aspNetUser.ManagedBy
        };
    }

    public AspNetUser ToAspNetUser()
    {
        return new AspNetUser
        {
            Id = Id,
            UserName = UserName,
            NormalizedUserName = NormalizedUserName,
            Email = Email,
            NormalizedEmail = NormalizedEmail,
            EmailConfirmed = EmailConfirmed,
            PasswordHash = PasswordHash,
            SecurityStamp = SecurityStamp,
            ConcurrencyStamp = ConcurrencyStamp,
            PhoneNumber = PhoneNumber,
            PhoneNumberConfirmed = PhoneNumberConfirmed,
            TwoFactorEnabled = TwoFactorEnabled,
            LockoutEnd = LockoutEnd,
            LockoutEnabled = LockoutEnabled,
            AccessFailedCount = AccessFailedCount,
            FullName = FullName,
            CreatedAt = CreatedAt,
            UpdatedAt = UpdatedAt,
            IsActive = IsActive,
            Role = Role,
            DisplayName = DisplayName,
            PhotoId = PhotoId,
            DefaultAccountId = DefaultAccountId,
            DateOfBirth = DateOfBirth,
            Address = Address,
            City = City,
            ZipCode = ZipCode,
            Province = Province,
            ManagedUserIds = ManagedUserIds,
            ManagedBy = ManagedBy
        };
    }
}
