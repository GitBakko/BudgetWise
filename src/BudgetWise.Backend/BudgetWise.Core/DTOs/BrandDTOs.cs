using System.ComponentModel.DataAnnotations;

namespace BudgetWise.Core.DTOs;

/// <summary>
/// DTO per suggerimenti di brand
/// </summary>
public class BrandSuggestionDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string Source { get; set; } = string.Empty; // 'local' | 'brandfetch'
}

/// <summary>
/// DTO per richiesta dettagli brand
/// </summary>
public class BrandDetailsRequestDto
{
    [Required]
    public string BrandId { get; set; } = string.Empty;
}

/// <summary>
/// DTO per risultato generazione icona
/// </summary>
public class IconGenerationResultDto
{
    public string DataUri { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

/// <summary>
/// DTO per richiesta generazione icona AI
/// </summary>
public class IconGenerationRequestDto
{
    [Required]
    [MinLength(2)]
    public string Name { get; set; } = string.Empty;
    
    public string Style { get; set; } = "modern"; // 'modern' | 'minimal' | 'colorful'
    
    public int Size { get; set; } = 256;
}

/// <summary>
/// DTO per richiesta upload icona
/// </summary>
public class IconUploadRequestDto
{
    [Required]
    public string DataUri { get; set; } = string.Empty;
    
    public string? FileName { get; set; }
}

/// <summary>
/// DTO per risultato upload icona
/// </summary>
public class IconUploadResultDto
{
    public string IconId { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
}

/// <summary>
/// DTO per salvataggio brand locale
/// </summary>
public class SaveBrandRequestDto
{
    [Required]
    [MinLength(2)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string LogoUrl { get; set; } = string.Empty;
    
    public string? Color { get; set; }
    
    public string? Description { get; set; }
}
