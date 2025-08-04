using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BudgetWise.Core.DTOs;
using BudgetWise.Core.Interfaces;
using BudgetWise.Data.Models;

namespace BudgetWise.Core.Services;

/// <summary>
/// Servizio per l'autenticazione con ASP.NET Core Identity e JWT
/// Implementa il Repository Pattern per la gestione degli utenti
/// </summary>
public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Effettua il login di un utente e genera un JWT token
    /// </summary>
    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        try
        {
            _logger.LogInformation("Tentativo di login per l'email: {Email}", request.Email);

            // Trova l'utente per email
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning("Tentativo di login fallito: utente non trovato per email {Email}", request.Email);
                return new LoginResponseDto
                {
                    Success = false,
                    Error = "Credenziali non valide"
                };
            }

            // Verifica la password
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            if (!result.Succeeded)
            {
                _logger.LogWarning("Tentativo di login fallito: password errata per email {Email}", request.Email);
                return new LoginResponseDto
                {
                    Success = false,
                    Error = "Credenziali non valide"
                };
            }

            // Genera il JWT token
            var token = await GenerateJwtTokenAsync(user);

            _logger.LogInformation("Login riuscito per l'utente: {Email}", user.Email);

            return new LoginResponseDto
            {
                Success = true,
                Token = token,
                DisplayName = user.DisplayName ?? user.FullName ?? user.Email!
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore durante il login per l'email: {Email}", request.Email);
            return new LoginResponseDto
            {
                Success = false,
                Error = "Errore interno del server"
            };
        }
    }

    /// <summary>
    /// Registra un nuovo utente
    /// </summary>
    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        try
        {
            _logger.LogInformation("Tentativo di registrazione per l'email: {Email}", request.Email);

            // Verifica se l'utente esiste già
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("Tentativo di registrazione fallito: email già esistente {Email}", request.Email);
                return new LoginResponseDto
                {
                    Success = false,
                    Error = "L'email è già registrata"
                };
            }

            // Crea il nuovo utente
            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                DisplayName = request.FullName,
                EmailConfirmed = true // Per ora confermiamo automaticamente
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Registrazione fallita per {Email}: {Errors}", request.Email, errors);
                return new LoginResponseDto
                {
                    Success = false,
                    Error = $"Errore nella registrazione: {errors}"
                };
            }

            // Genera il JWT token per l'utente appena registrato
            var token = await GenerateJwtTokenAsync(user);

            _logger.LogInformation("Registrazione riuscita per l'utente: {Email}", user.Email);

            return new LoginResponseDto
            {
                Success = true,
                Token = token,
                DisplayName = user.DisplayName ?? user.FullName ?? user.Email!
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore durante la registrazione per l'email: {Email}", request.Email);
            return new LoginResponseDto
            {
                Success = false,
                Error = "Errore interno del server"
            };
        }
    }

    /// <summary>
    /// Verifica la validità di un JWT token
    /// </summary>
    public Task<bool> VerifyTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);

            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidAudience = _configuration["Jwt:Audience"],
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Token non valido: {Token}", token);
            return Task.FromResult(false);
        }
    }

    /// <summary>
    /// Aggiorna la password di un utente
    /// </summary>
    public async Task<bool> UpdatePasswordAsync(string email, string newPassword)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Tentativo di aggiornamento password: utente non trovato per email {Email}", email);
                return false;
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, newPassword);

            if (result.Succeeded)
            {
                _logger.LogInformation("Password aggiornata con successo per l'utente: {Email}", email);
                return true;
            }

            var errors = string.Join(", ", result.Errors.Select(e => e.Description));
            _logger.LogWarning("Aggiornamento password fallito per {Email}: {Errors}", email, errors);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore durante l'aggiornamento password per l'email: {Email}", email);
            return false;
        }
    }

    /// <summary>
    /// Genera un JWT token per l'utente specificato
    /// </summary>
    private async Task<string> GenerateJwtTokenAsync(ApplicationUser user)
    {
        var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!);
        var issuer = _configuration["Jwt:Issuer"]!;
        var audience = _configuration["Jwt:Audience"]!;
        var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryInMinutes"] ?? "60");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName!),
            new(ClaimTypes.Email, user.Email!)
        };

        // Aggiungi i ruoli dell'utente
        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        _logger.LogDebug("JWT token generato per l'utente: {Email}, scadenza: {Expiry}", user.Email, tokenDescriptor.Expires);

        return tokenHandler.WriteToken(token);
    }
}
