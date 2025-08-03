using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BudgetWise.Core.Interfaces;
using BudgetWise.Core.DTOs;

namespace BudgetWise.Api.Controllers;

/// <summary>
/// Controller per la gestione dei conti bancari e finanziari
/// Mobile-First: Ottimizzato per dispositivi touch con API responsive
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Accounts")]
[Authorize] // Riattivo autorizzazione per dati reali
public class AccountsController : ControllerBase
{
    private readonly ILogger<AccountsController> _logger;
    private readonly IAccountService _accountService;

    public AccountsController(ILogger<AccountsController> logger, IAccountService accountService)
    {
        _logger = logger;
        _accountService = accountService;
    }

    /// <summary>
    /// Ottieni tutti i conti dell'utente autenticato
    /// </summary>
    /// <returns>Lista dei conti dell'utente con bilanci reali</returns>
    /// <response code="200">Lista dei conti recuperata con successo</response>
    /// <response code="401">Utente non autenticato</response>
    /// <response code="500">Errore interno del server</response>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AccountResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<IEnumerable<AccountResponseDto>>> GetAccounts()
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new ProblemDetails
                {
                    Title = "Utente non autenticato",
                    Detail = "Non è possibile identificare l'utente corrente.",
                    Status = 401
                });
            }
            
            _logger.LogInformation("Getting accounts for user: {UserId}", userId);
            
            var accounts = await _accountService.GetAccountsAsync(userId);
            
            return Ok(accounts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting accounts for user");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Errore nel recupero dei conti",
                Detail = "Si è verificato un errore durante il recupero dei conti.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Ottieni un conto specifico per ID
    /// </summary>
    /// <param name="id">ID del conto (Guid)</param>
    /// <returns>Dettagli del conto</returns>
    /// <response code="200">Conto recuperato con successo</response>
    /// <response code="401">Utente non autenticato</response>
    /// <response code="404">Conto non trovato</response>
    /// <response code="500">Errore interno del server</response>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(AccountResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AccountResponseDto>> GetAccount(Guid id)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            
            _logger.LogInformation("Getting account {AccountId} for user: {UserId}", id, userId);
            
            var account = await _accountService.GetAccountAsync(id, userId);
            
            if (account == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Conto non trovato",
                    Detail = $"Il conto con ID {id} non è stato trovato.",
                    Status = 404
                });
            }
            
            return Ok(account);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting account {AccountId}", id);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Errore nel recupero del conto",
                Detail = "Si è verificato un errore durante il recupero del conto.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Crea un nuovo conto
    /// Mobile-First: Validazione ottimizzata per input touch
    /// </summary>
    /// <param name="request">Dati del nuovo conto</param>
    /// <returns>Conto creato</returns>
    /// <response code="201">Conto creato con successo</response>
    /// <response code="400">Dati di input non validi</response>
    /// <response code="401">Utente non autenticato</response>
    /// <response code="500">Errore interno del server</response>
    [HttpPost]
    [ProducesResponseType(typeof(AccountResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AccountResponseDto>> CreateAccount([FromBody] CreateAccountRequestDto request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            
            _logger.LogInformation("Creating account for user: {UserId}", userId);
            
            var account = await _accountService.CreateAccountAsync(request, userId);
            
            _logger.LogInformation("Account {AccountId} created successfully for user: {UserId}", account.Id, userId);
            
            return CreatedAtAction(nameof(GetAccount), new { id = account.Id }, account);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating account");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Errore nella creazione del conto",
                Detail = "Si è verificato un errore durante la creazione del conto.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Aggiorna un conto esistente
    /// Mobile-First: Supporta aggiornamenti parziali per connessioni lente
    /// </summary>
    /// <param name="id">ID del conto da aggiornare (Guid)</param>
    /// <param name="request">Dati da aggiornare</param>
    /// <returns>Conto aggiornato</returns>
    /// <response code="200">Conto aggiornato con successo</response>
    /// <response code="400">Dati di input non validi</response>
    /// <response code="401">Utente non autenticato</response>
    /// <response code="404">Conto non trovato</response>
    /// <response code="500">Errore interno del server</response>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(AccountResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AccountResponseDto>> UpdateAccount(Guid id, [FromBody] UpdateAccountRequestDto request)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            
            _logger.LogInformation("Updating account {AccountId} for user: {UserId}", id, userId);
            
            var account = await _accountService.UpdateAccountAsync(id, request, userId);
            
            if (account == null)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Conto non trovato",
                    Detail = $"Il conto con ID {id} non è stato trovato.",
                    Status = 404
                });
            }
            
            _logger.LogInformation("Account {AccountId} updated successfully for user: {UserId}", id, userId);
            
            return Ok(account);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating account {AccountId}", id);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Errore nell'aggiornamento del conto",
                Detail = "Si è verificato un errore durante l'aggiornamento del conto.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Elimina un conto
    /// Mobile-First: Conferma soft-delete per prevenire eliminazioni accidentali
    /// </summary>
    /// <param name="id">ID del conto da eliminare (Guid)</param>
    /// <returns>Conferma dell'eliminazione</returns>
    /// <response code="204">Conto eliminato con successo</response>
    /// <response code="401">Utente non autenticato</response>
    /// <response code="404">Conto non trovato</response>
    /// <response code="500">Errore interno del server</response>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult> DeleteAccount(Guid id)
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            
            _logger.LogInformation("Deleting account {AccountId} for user: {UserId}", id, userId);
            
            var success = await _accountService.DeleteAccountAsync(id, userId);
            
            if (!success)
            {
                return NotFound(new ProblemDetails
                {
                    Title = "Conto non trovato",
                    Detail = $"Il conto con ID {id} non è stato trovato.",
                    Status = 404
                });
            }
            
            _logger.LogInformation("Account {AccountId} deleted successfully for user: {UserId}", id, userId);
            
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account {AccountId}", id);
            return StatusCode(500, new ProblemDetails
            {
                Title = "Errore nell'eliminazione del conto",
                Detail = "Si è verificato un errore durante l'eliminazione del conto.",
                Status = 500
            });
        }
    }

    /// <summary>
    /// Ottieni il riepilogo dei conti per la dashboard
    /// Mobile-First: Dati aggregati per visualizzazione rapida
    /// </summary>
    /// <returns>Riepilogo dei conti</returns>
    /// <response code="200">Riepilogo recuperato con successo</response>
    /// <response code="401">Utente non autenticato</response>
    /// <response code="500">Errore interno del server</response>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(AccountSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<AccountSummaryDto>> GetAccountSummary()
    {
        try
        {
            var userId = User.FindFirst("sub")?.Value ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }
            
            _logger.LogInformation("Getting account summary for user: {UserId}", userId);
            
            var summary = await _accountService.GetAccountSummaryAsync(userId);
            
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting account summary");
            return StatusCode(500, new ProblemDetails
            {
                Title = "Errore nel recupero del riepilogo",
                Detail = "Si è verificato un errore durante il recupero del riepilogo dei conti.",
                Status = 500
            });
        }
    }
}
