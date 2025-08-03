using BudgetWise.Data.Interfaces;
using BudgetWise.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BudgetWise.Data.Repositories;

/// <summary>
/// Repository implementation for Account data access
/// Repository Pattern: EF Core 9 implementation with proper separation
/// </summary>
public class AccountRepository : IAccountRepository
{
    private readonly BudgetWiseDbContext _context;
    private readonly ILogger<AccountRepository> _logger;

    public AccountRepository(BudgetWiseDbContext context, ILogger<AccountRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<Account>> GetAccountsByUserIdAsync(string userId)
    {
        _logger.LogDebug("Fetching accounts for user {UserId}", userId);
        
        return await _context.Accounts
            .Where(a => a.UserId == userId)
            .Include(a => a.Transactions) // Navigation property
            .OrderBy(a => a.Name)
            .ToListAsync();
    }

    public async Task<Account?> GetAccountByIdAsync(Guid accountId, string userId)
    {
        _logger.LogDebug("Fetching account {AccountId} for user {UserId}", accountId, userId);
        
        return await _context.Accounts
            .Include(a => a.Transactions)
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);
    }

    public async Task<Account> CreateAccountAsync(Account account)
    {
        _logger.LogDebug("Creating new account for user {UserId}", account.UserId);
        
        _context.Accounts.Add(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task<Account> UpdateAccountAsync(Account account)
    {
        _logger.LogDebug("Updating account {AccountId}", account.Id);
        
        _context.Accounts.Update(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task<bool> DeleteAccountAsync(Guid accountId, string userId)
    {
        _logger.LogDebug("Deleting account {AccountId} for user {UserId}", accountId, userId);
        
        var account = await _context.Accounts
            .FirstOrDefaultAsync(a => a.Id == accountId && a.UserId == userId);
        
        if (account == null)
            return false;

        _context.Accounts.Remove(account);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AccountExistsAsync(Guid accountId, string userId)
    {
        return await _context.Accounts
            .AnyAsync(a => a.Id == accountId && a.UserId == userId);
    }
}
