using System.ComponentModel.DataAnnotations;

namespace BudgetWise.Core.DTOs;

/// <summary>
/// DTO per la richiesta di login
/// </summary>
public class LoginRequestDto
{
    /// <summary>
    /// Email dell'utente
    /// </summary>
    /// <example>bakko.posta@gmail.com</example>
    [Required(ErrorMessage = "Email è richiesta")]
    [EmailAddress(ErrorMessage = "Formato email non valido")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password dell'utente
    /// </summary>
    /// <example>PassBakko1983@</example>
    [Required(ErrorMessage = "Password è richiesta")]
    [MinLength(8, ErrorMessage = "Password deve essere almeno 8 caratteri")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// DTO per la richiesta di registrazione
/// </summary>
public class RegisterRequestDto
{
    /// <summary>
    /// Email dell'utente
    /// </summary>
    /// <example>nuovo.utente@gmail.com</example>
    [Required(ErrorMessage = "Email è richiesta")]
    [EmailAddress(ErrorMessage = "Formato email non valido")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Password dell'utente
    /// </summary>
    /// <example>Password123!</example>
    [Required(ErrorMessage = "Password è richiesta")]
    [MinLength(8, ErrorMessage = "Password deve essere almeno 8 caratteri")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Nome completo dell'utente
    /// </summary>
    /// <example>Mario Rossi</example>
    [Required(ErrorMessage = "Nome completo è richiesto")]
    [StringLength(100, ErrorMessage = "Nome completo non può superare 100 caratteri")]
    public string FullName { get; set; } = string.Empty;
}

/// <summary>
/// DTO per la risposta di login
/// </summary>
public class LoginResponseDto
{
    /// <summary>
    /// Token JWT per l'autenticazione
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</example>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Nome visualizzato dell'utente
    /// </summary>
    /// <example>Mario Rossi</example>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Indica se l'operazione è riuscita
    /// </summary>
    /// <example>true</example>
    public bool Success { get; set; }

    /// <summary>
    /// Messaggio di errore se presente
    /// </summary>
    /// <example>null</example>
    public string? Error { get; set; }
}

/// <summary>
/// Alias per LoginResponseDto per compatibilità con documentazione API
/// </summary>
public class AuthResponseDto : LoginResponseDto
{
}

/// <summary>
/// Risultato delle operazioni di autenticazione
/// </summary>
public class AuthResult
{
    /// <summary>
    /// Indica se l'operazione è riuscita
    /// </summary>
    /// <example>true</example>
    public bool Success { get; set; }

    /// <summary>
    /// Token JWT se l'autenticazione è riuscita
    /// </summary>
    /// <example>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</example>
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Nome visualizzato dell'utente
    /// </summary>
    /// <example>Mario Rossi</example>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Messaggio di errore se presente
    /// </summary>
    /// <example>null</example>
    public string? Error { get; set; }

    public static AuthResult Successful(string token, string displayName)
    {
        return new AuthResult
        {
            Success = true,
            Token = token,
            DisplayName = displayName
        };
    }

    public static AuthResult Failure(string error)
    {
        return new AuthResult
        {
            Success = false,
            Error = error
        };
    }
}
