using BudgetWise.Core.DTOs;
using BudgetWise.Core.Interfaces;
using BudgetWise.Data.Interfaces;
using BudgetWise.Data.Models;
using Microsoft.Extensions.Logging;

namespace BudgetWise.Core.Services;

/// <summary>
/// Business logic service for Account management
/// Repository Pattern: Uses repository for data access abstraction
/// Mobile-First: Optimized for mobile devices
/// </summary>
public class AccountService : IAccountService
{
    private readonly ILogger<AccountService> _logger;
    private readonly IAccountRepository _accountRepository;

    public AccountService(ILogger<AccountService> logger, IAccountRepository accountRepository)
    {
        _logger = logger;
        _accountRepository = accountRepository;
    }

    public async Task<IEnumerable<AccountResponseDto>> GetAccountsAsync(string userId)
    {
        _logger.LogInformation("Getting accounts for user: {UserId}", userId);
        
        var accounts = await _accountRepository.GetAccountsByUserIdAsync(userId);
        
        return accounts.Select(account => new AccountResponseDto
        {
            Id = account.Id,
            Name = account.Name,
            CreatedAt = account.CreatedAt,
            BalanceStartDate = account.BalanceStartDate,
            IconId = account.IconId,
            Color = account.Color,
            // Calculate balances from transactions (loaded via navigation property)
            CurrentBalance = account.Transactions
                .Where(t => t.Type == "Income")
                .Sum(t => t.Amount) - 
                account.Transactions
                .Where(t => t.Type == "Expense")
                .Sum(t => t.Amount),
            TotalIncome = account.Transactions
                .Where(t => t.Type == "Income")
                .Sum(t => t.Amount),
            TotalExpense = account.Transactions
                .Where(t => t.Type == "Expense")
                .Sum(t => t.Amount),
            TransactionCount = account.Transactions.Count
        });
    }

    public async Task<AccountResponseDto?> GetAccountAsync(Guid accountId, string userId)
    {
        _logger.LogInformation("Getting account {AccountId} for user: {UserId}", accountId, userId);
        
        var account = await _accountRepository.GetAccountByIdAsync(accountId, userId);
        
        if (account == null)
        {
            _logger.LogWarning("Account {AccountId} not found for user {UserId}", accountId, userId);
            return null;
        }

        return new AccountResponseDto
        {
            Id = account.Id,
            Name = account.Name,
            CreatedAt = account.CreatedAt,
            BalanceStartDate = account.BalanceStartDate,
            IconId = account.IconId,
            Color = account.Color,
            CurrentBalance = account.Transactions
                .Where(t => t.Type == "Income")
                .Sum(t => t.Amount) - 
                account.Transactions
                .Where(t => t.Type == "Expense")
                .Sum(t => t.Amount),
            TotalIncome = account.Transactions
                .Where(t => t.Type == "Income")
                .Sum(t => t.Amount),
            TotalExpense = account.Transactions
                .Where(t => t.Type == "Expense")
                .Sum(t => t.Amount),
            TransactionCount = account.Transactions.Count
        };
    }

    public async Task<AccountResponseDto> CreateAccountAsync(CreateAccountRequestDto createAccountDto, string userId)
    {
        _logger.LogInformation("Creating account for user: {UserId}", userId);

        var account = new Account
        {
            Name = createAccountDto.Name,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            BalanceStartDate = createAccountDto.BalanceStartDate ?? DateTime.UtcNow,
            IconId = createAccountDto.IconId ?? Guid.NewGuid(),
            Color = createAccountDto.Color ?? "#007bff"
        };

        var createdAccount = await _accountRepository.CreateAccountAsync(account);

        _logger.LogInformation("Account created with ID: {AccountId}", createdAccount.Id);

        return new AccountResponseDto
        {
            Id = createdAccount.Id,
            Name = createdAccount.Name,
            CreatedAt = createdAccount.CreatedAt,
            BalanceStartDate = createdAccount.BalanceStartDate,
            IconId = createdAccount.IconId,
            Color = createdAccount.Color,
            CurrentBalance = 0,
            TotalIncome = 0,
            TotalExpense = 0,
            TransactionCount = 0
        };
    }

    public async Task<AccountResponseDto?> UpdateAccountAsync(Guid accountId, UpdateAccountRequestDto updateAccountDto, string userId)
    {
        _logger.LogInformation("Updating account {AccountId} for user: {UserId}", accountId, userId);

        var account = await _accountRepository.GetAccountByIdAsync(accountId, userId);
        
        if (account == null)
        {
            _logger.LogWarning("Account {AccountId} not found for user {UserId}", accountId, userId);
            return null;
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(updateAccountDto.Name))
            account.Name = updateAccountDto.Name;
        
        if (updateAccountDto.IconId.HasValue)
            account.IconId = updateAccountDto.IconId.Value;
            
        if (!string.IsNullOrEmpty(updateAccountDto.Color))
            account.Color = updateAccountDto.Color;

        var updatedAccount = await _accountRepository.UpdateAccountAsync(account);

        _logger.LogInformation("Account {AccountId} updated successfully", accountId);

        return new AccountResponseDto
        {
            Id = updatedAccount.Id,
            Name = updatedAccount.Name,
            CreatedAt = updatedAccount.CreatedAt,
            BalanceStartDate = updatedAccount.BalanceStartDate,
            IconId = updatedAccount.IconId,
            Color = updatedAccount.Color,
            CurrentBalance = updatedAccount.Transactions
                .Where(t => t.Type == "Income")
                .Sum(t => t.Amount) - 
                updatedAccount.Transactions
                .Where(t => t.Type == "Expense")
                .Sum(t => t.Amount),
            TotalIncome = updatedAccount.Transactions
                .Where(t => t.Type == "Income")
                .Sum(t => t.Amount),
            TotalExpense = updatedAccount.Transactions
                .Where(t => t.Type == "Expense")
                .Sum(t => t.Amount),
            TransactionCount = updatedAccount.Transactions.Count
        };
    }

    public async Task<bool> DeleteAccountAsync(Guid accountId, string userId)
    {
        _logger.LogInformation("Deleting account {AccountId} for user: {UserId}", accountId, userId);

        var result = await _accountRepository.DeleteAccountAsync(accountId, userId);

        if (result)
        {
            _logger.LogInformation("Account {AccountId} deleted successfully", accountId);
        }
        else
        {
            _logger.LogWarning("Account {AccountId} not found or could not be deleted for user {UserId}", accountId, userId);
        }

        return result;
    }

    public async Task<bool> AccountExistsAsync(Guid accountId, string userId)
    {
        return await _accountRepository.AccountExistsAsync(accountId, userId);
    }

    public async Task<AccountSummaryDto> GetAccountSummaryAsync(string userId)
    {
        _logger.LogInformation("Getting account summary for user: {UserId}", userId);
        
        var accounts = await _accountRepository.GetAccountsByUserIdAsync(userId);
        
        var totalBalance = accounts.Sum(a => a.Transactions
            .Where(t => t.Type == "Income")
            .Sum(t => t.Amount) - 
            a.Transactions
            .Where(t => t.Type == "Expense")
            .Sum(t => t.Amount));
        
        var totalIncome = accounts.SelectMany(a => a.Transactions)
            .Where(t => t.Type == "Income")
            .Sum(t => t.Amount);
            
        var totalExpense = accounts.SelectMany(a => a.Transactions)
            .Where(t => t.Type == "Expense")
            .Sum(t => t.Amount);

        return new AccountSummaryDto
        {
            TotalAccounts = accounts.Count(),
            TotalBalance = totalBalance,
            TotalAssets = totalBalance > 0 ? totalBalance : 0,
            TotalLiabilities = totalBalance < 0 ? Math.Abs(totalBalance) : 0,
            MonthlyIncome = totalIncome,
            MonthlyExpenses = totalExpense
        };
    }
}
