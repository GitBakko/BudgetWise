using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BudgetWise.Core.DTOs;
using BudgetWise.Core.Interfaces;
using BudgetWise.Data.Entities;

namespace BudgetWise.Data.Services;

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

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = "UserLogin",
            ["Email"] = request.Email
        });

        try
        {
            _logger.LogInformation("Attempting login for {Email}", request.Email);
            
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                _logger.LogWarning("Login failed: User not found for {Email}", request.Email);
                return new LoginResponseDto { Success = false, Error = "Credenziali non valide" };
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
            
            if (!result.Succeeded)
            {
                _logger.LogWarning("Login failed for {Email}: {Reason}", 
                    request.Email, 
                    result.IsLockedOut ? "Account locked" : 
                    result.IsNotAllowed ? "Account not allowed" : 
                    "Invalid password");
                return new LoginResponseDto { Success = false, Error = "Credenziali non valide" };
            }

            var token = GenerateJwtToken(user);
            
            _logger.LogInformation("Login successful for {Email} with UserId {UserId}", 
                request.Email, user.Id);
            
            return new LoginResponseDto 
            { 
                Success = true, 
                Token = token, 
                DisplayName = user.DisplayName ?? user.FullName ?? user.Email ?? "" 
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore durante il login per l'utente {Email}", request.Email);
            return new LoginResponseDto { Success = false, Error = "Errore interno del server" };
        }
    }

    public async Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = "UserRegistration",
            ["Email"] = request.Email
        });

        try
        {
            _logger.LogInformation("Attempting registration for {Email}", request.Email);
            
            var existingUser = await _userManager.FindByEmailAsync(request.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("Registration failed: User already exists for {Email}", request.Email);
                return new LoginResponseDto { Success = false, Error = "Un utente con questa email esiste già" };
            }

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.FullName,
                DisplayName = request.FullName,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Registration failed for {Email}: {Errors}", 
                    request.Email, errors);
                return new LoginResponseDto { Success = false, Error = $"Errore nella registrazione: {errors}" };
            }

            var token = GenerateJwtToken(user);
            
            _logger.LogInformation("Registration successful for {Email} with UserId {UserId}", 
                request.Email, user.Id);
            
            return new LoginResponseDto 
            { 
                Success = true, 
                Token = token, 
                DisplayName = user.DisplayName ?? user.FullName ?? user.Email ?? "" 
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore durante la registrazione per l'utente {Email}", request.Email);
            return new LoginResponseDto { Success = false, Error = "Errore interno del server" };
        }
    }

    public Task<bool> VerifyTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "");
            
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            return Task.FromResult(true);
        }
        catch
        {
            return Task.FromResult(false);
        }
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "");
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(ClaimTypes.Name, user.FullName ?? ""),
                new Claim("role", user.Role ?? "user")
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _configuration["Jwt:Issuer"],
            Audience = _configuration["Jwt:Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<bool> UpdatePasswordAsync(string email, string newPassword)
    {
        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["Operation"] = "PasswordUpdate",
            ["Email"] = email
        });

        try
        {
            _logger.LogInformation("Attempting password update for {Email}", email);
            
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                _logger.LogWarning("Password update failed: User not found for {Email}", email);
                return false;
            }

            // Rimuovi la password esistente e imposta quella nuova
            var removeResult = await _userManager.RemovePasswordAsync(user);
            if (!removeResult.Succeeded)
            {
                var errors = string.Join(", ", removeResult.Errors.Select(e => e.Description));
                _logger.LogError("Failed to remove existing password for {Email}: {Errors}", 
                    email, errors);
                return false;
            }

            var addResult = await _userManager.AddPasswordAsync(user, newPassword);
            if (!addResult.Succeeded)
            {
                var errors = string.Join(", ", addResult.Errors.Select(e => e.Description));
                _logger.LogError("Failed to add new password for {Email}: {Errors}", 
                    email, errors);
                return false;
            }

            _logger.LogInformation("Password updated successfully for {Email} with UserId {UserId}", 
                email, user.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating password for user: {Email}", email);
            return false;
        }
    }
}
