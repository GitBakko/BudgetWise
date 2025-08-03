using BudgetWise.Data.Models;

namespace BudgetWise.Data.Interfaces;

/// <summary>
/// Repository interface for Account data access
/// Repository Pattern: Data access abstraction
/// </summary>
public interface IAccountRepository
{
    Task<IEnumerable<Account>> GetAccountsByUserIdAsync(string userId);
    Task<Account?> GetAccountByIdAsync(Guid accountId, string userId);
    Task<Account> CreateAccountAsync(Account account);
    Task<Account> UpdateAccountAsync(Account account);
    Task<bool> DeleteAccountAsync(Guid accountId, string userId);
    Task<bool> AccountExistsAsync(Guid accountId, string userId);
}
