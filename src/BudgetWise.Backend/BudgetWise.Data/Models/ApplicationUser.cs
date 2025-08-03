using Microsoft.AspNetCore.Identity;

namespace BudgetWise.Data.Models;

/// <summary>
/// Estende IdentityUser per il sistema di autenticazione
/// </summary>
public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public string? DisplayName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
