using System.ComponentModel.DataAnnotations;

namespace BudgetWise.Core.DTOs;

/// <summary>
/// DTO per richiedere il processing di un logo esterno
/// </summary>
public class ProcessExternalLogoRequestDto
{
    /// <summary>
    /// URL del logo da processare
    /// </summary>
    [Required(ErrorMessage = "URL del logo è richiesto")]
    [Url(ErrorMessage = "URL non valido")]
    public string LogoUrl { get; set; } = string.Empty;
}