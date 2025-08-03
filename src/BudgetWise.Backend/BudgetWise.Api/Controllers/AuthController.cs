using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BudgetWise.Data.Models;
using BudgetWise.Core.Interfaces;
using BudgetWise.Core.DTOs;

namespace BudgetWise.Api.Controllers;

/// <summary>
/// Controller per l'autenticazione con ASP.NET Core Identity
/// Utilizza il database esistente tramite MCP SQL Server
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Authentication")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;
    private readonly IAuthService _authService;

    public AuthController(ILogger<AuthController> logger, IAuthService authService)
    {
        _logger = logger;
        _authService = authService;
    }

    /// <summary>
    /// Effettua il login di un utente
    /// </summary>
    /// <param name="request">Credenziali di login (email e password)</param>
    /// <returns>Token JWT e informazioni utente</returns>
    /// <response code="200">Login effettuato con successo</response>
    /// <response code="400">Dati di input non validi</response>
    /// <response code="401">Credenziali errate</response>
    /// <response code="500">Errore interno del server</response>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            _logger.LogInformation("Login attempt for user: {Email}", request.Email);
            
            var result = await _authService.LoginAsync(request);
            
            _logger.LogInformation("Login successful for user: {Email}", request.Email);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed for user: {Email} - {Message}", request.Email, ex.Message);
            return Unauthorized(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user: {Email}", request.Email);
            return StatusCode(500, new { Message = "Errore interno del server" });
        }
    }

    /// <summary>
    /// Endpoint per la registrazione di nuovi utenti
    /// </summary>
    [HttpPost("register")]
    public async Task<ActionResult<LoginResponseDto>> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            _logger.LogInformation("Registration attempt for user: {Email}", request.Email);
            
            var result = await _authService.RegisterAsync(request);
            
            _logger.LogInformation("Registration successful for user: {Email}", request.Email);
            return CreatedAtAction(nameof(Register), result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Registration failed for user: {Email} - {Message}", request.Email, ex.Message);
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration for user: {Email}", request.Email);
            return StatusCode(500, new { Message = "Errore interno del server" });
        }
    }

    /// <summary>
    /// Endpoint per verificare la validità di un token JWT
    /// </summary>
    [HttpGet("verify")]
    [Authorize]
    public async Task<ActionResult<object>> VerifyToken()
    {
        try
        {
            var authHeader = Request.Headers.Authorization.FirstOrDefault();
            if (authHeader == null || !authHeader.StartsWith("Bearer "))
            {
                return BadRequest(new { Message = "Token mancante" });
            }

            var token = authHeader["Bearer ".Length..].Trim();
            var isValid = await _authService.VerifyTokenAsync(token);
            
            if (!isValid)
            {
                return Unauthorized(new { Message = "Token non valido" });
            }

            return Ok(new { Valid = true, Message = "Token valido" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token verification");
            return StatusCode(500, new { Message = "Errore interno del server" });
        }
    }

    /// <summary>
    /// Endpoint per ottenere le informazioni dell'utente corrente
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public ActionResult<object> GetCurrentUser()
    {
        try
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
            var emailClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Email);
            var nameClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Name);
            var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role);

            return Ok(new 
            {
                Id = userIdClaim?.Value,
                Email = emailClaim?.Value,
                Name = nameClaim?.Value,
                Role = roleClaim?.Value
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current user info");
            return StatusCode(500, new { Message = "Errore interno del server" });
        }
    }

    /// <summary>
    /// Endpoint temporaneo per aggiornare la password di un utente specifico
    /// </summary>
    [HttpPost("update-password")]
    public async Task<ActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
    {
        try
        {
            _logger.LogInformation("Password update attempt for user: {Email}", request.Email);
            
            var result = await _authService.UpdatePasswordAsync(request.Email, request.NewPassword);
            
            if (result)
            {
                _logger.LogInformation("Password updated successfully for user: {Email}", request.Email);
                return Ok(new { Message = "Password aggiornata con successo" });
            }
            else
            {
                return BadRequest(new { Message = "Impossibile aggiornare la password" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating password for user: {Email}", request.Email);
            return StatusCode(500, new { Message = "Errore interno del server" });
        }
    }
}

public class UpdatePasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
