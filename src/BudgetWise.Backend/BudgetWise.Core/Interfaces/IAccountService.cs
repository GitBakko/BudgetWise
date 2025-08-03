using BudgetWise.Core.DTOs;

namespace BudgetWise.Core.Interfaces;

/// <summary>
/// Servizio per la gestione dei conti bancari e finanziari
/// Mobile-First: Metodi asincroni per operazioni responsive
/// Integrazione MCP SQL Server per dati reali
/// </summary>
public interface IAccountService
{
    /// <summary>
    /// Ottieni tutti i conti dell'utente
    /// </summary>
    /// <param name="userId">ID dell'utente</param>
    /// <returns>Lista dei conti dell'utente con bilanci calcolati</returns>
    Task<IEnumerable<AccountResponseDto>> GetAccountsAsync(string userId);
    
    /// <summary>
    /// Ottieni un conto specifico per ID
    /// </summary>
    /// <param name="accountId">ID del conto (Guid)</param>
    /// <param name="userId">ID dell'utente (per verifica proprietà)</param>
    /// <returns>Dettagli del conto con bilancio calcolato o null se non trovato</returns>
    Task<AccountResponseDto?> GetAccountAsync(Guid accountId, string userId);
    
    /// <summary>
    /// Crea un nuovo conto
    /// </summary>
    /// <param name="request">Dati del nuovo conto</param>
    /// <param name="userId">ID dell'utente proprietario</param>
    /// <returns>Conto creato</returns>
    Task<AccountResponseDto> CreateAccountAsync(CreateAccountRequestDto request, string userId);
    
    /// <summary>
    /// Aggiorna un conto esistente
    /// </summary>
    /// <param name="accountId">ID del conto da aggiornare (Guid)</param>
    /// <param name="request">Dati da aggiornare</param>
    /// <param name="userId">ID dell'utente (per verifica proprietà)</param>
    /// <returns>Conto aggiornato o null se non trovato</returns>
    Task<AccountResponseDto?> UpdateAccountAsync(Guid accountId, UpdateAccountRequestDto request, string userId);
    
    /// <summary>
    /// Elimina un conto
    /// </summary>
    /// <param name="accountId">ID del conto da eliminare (Guid)</param>
    /// <param name="userId">ID dell'utente (per verifica proprietà)</param>
    /// <returns>True se eliminato con successo, false se non trovato</returns>
    Task<bool> DeleteAccountAsync(Guid accountId, string userId);
    
    /// <summary>
    /// Ottieni il riepilogo dei conti per la dashboard
    /// Mobile-First: Dati aggregati per visualizzazione rapida
    /// </summary>
    /// <param name="userId">ID dell'utente</param>
    /// <returns>Riepilogo dei conti con calcoli reali</returns>
    Task<AccountSummaryDto> GetAccountSummaryAsync(string userId);
}