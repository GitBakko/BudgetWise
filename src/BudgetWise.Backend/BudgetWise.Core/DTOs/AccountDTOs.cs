using System.ComponentModel.DataAnnotations;

namespace BudgetWise.Core.DTOs;

/// <summary>
/// DTO per la risposta di un conto
/// Mobile-First: Campi ottimizzati per UI responsive
/// </summary>
public class AccountResponseDto
{
    public Guid Id { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; } = string.Empty;
    
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset BalanceStartDate { get; set; }
    
    public Guid? IconId { get; set; }
    
    [StringLength(7)] // Hex color format #RRGGBB
    public string? Color { get; set; }
    
    // Calculated fields from transactions
    public decimal CurrentBalance { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public int TransactionCount { get; set; }
    
    // Mobile-First: Campi computati per UI
    public string FormattedBalance => CurrentBalance.ToString("C2");
    public string FormattedTotalIncome => TotalIncome.ToString("C2");
    public string FormattedTotalExpense => TotalExpense.ToString("C2");
    public string DisplayColor => Color ?? "#42d8a7"; // Default green
}

/// <summary>
/// DTO per la creazione di un nuovo conto
/// Mobile-First: Validazione ottimizzata per input touch
/// </summary>
public class CreateAccountRequestDto
{
    [Required(ErrorMessage = "Il nome del conto è obbligatorio")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Il nome deve essere tra 3 e 100 caratteri")]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(7, MinimumLength = 7, ErrorMessage = "Il colore deve essere in formato hex (#RRGGBB)")]
    public string? Color { get; set; }
    
    public Guid? IconId { get; set; }
    
    public DateTimeOffset? BalanceStartDate { get; set; }
}

/// <summary>
/// DTO per l'aggiornamento di un conto esistente
/// Mobile-First: Supporta aggiornamenti parziali
/// </summary>
public class UpdateAccountRequestDto
{
    [StringLength(100, MinimumLength = 3, ErrorMessage = "Il nome deve essere tra 3 e 100 caratteri")]
    public string? Name { get; set; }
    
    [StringLength(7, MinimumLength = 7, ErrorMessage = "Il colore deve essere in formato hex (#RRGGBB)")]
    public string? Color { get; set; }
    
    public Guid? IconId { get; set; }
}

/// <summary>
/// DTO per il riepilogo dei conti (dashboard mobile)
/// Mobile-First: Dati essenziali per schermi piccoli
/// </summary>
public class AccountSummaryDto
{
    public int TotalAccounts { get; set; }
    public decimal TotalBalance { get; set; }
    public decimal TotalAssets { get; set; }
    public decimal TotalLiabilities { get; set; }
    public decimal MonthlyIncome { get; set; }
    public decimal MonthlyExpenses { get; set; }
    
    // Formatted fields for UI
    public string FormattedTotalBalance => TotalBalance.ToString("C2");
    public string FormattedTotalAssets => TotalAssets.ToString("C2");
    public string FormattedTotalLiabilities => TotalLiabilities.ToString("C2");
    public string FormattedMonthlyIncome => MonthlyIncome.ToString("C2");
    public string FormattedMonthlyExpenses => MonthlyExpenses.ToString("C2");
}