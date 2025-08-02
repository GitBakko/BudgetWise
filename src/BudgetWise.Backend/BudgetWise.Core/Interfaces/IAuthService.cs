using BudgetWise.Core.DTOs;

namespace BudgetWise.Core.Interfaces;

/// <summary>
/// Interfaccia per il servizio di autenticazione
/// </summary>
public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task<LoginResponseDto> RegisterAsync(RegisterRequestDto request);
    Task<bool> VerifyTokenAsync(string token);
    Task<bool> UpdatePasswordAsync(string email, string newPassword);
}
