using BudgetWise.Core.DTOs;

namespace BudgetWise.Core.Interfaces;

/// <summary>
/// Interfaccia per il servizio di gestione brand
/// Implementa ricerca locale e integrazione Brandfetch
/// </summary>
public interface IBrandService
{
    /// <summary>
    /// Cerca brand nel database locale
    /// </summary>
    Task<IEnumerable<BrandSuggestionDto>> SearchLocalBrandsAsync(string name);
    
    /// <summary>
    /// Cerca brand tramite Brandfetch API
    /// </summary>
    Task<IEnumerable<BrandSuggestionDto>> SearchBrandfetchAsync(string name);
    
    /// <summary>
    /// Ottiene dettagli completi di un brand da Brandfetch
    /// </summary>
    Task<IconGenerationResultDto?> GetBrandDetailsAsync(string brandId);
    
    /// <summary>
    /// Salva un brand nel database locale
    /// </summary>
    Task<BrandSuggestionDto> SaveBrandAsync(SaveBrandRequestDto request);
    
    /// <summary>
    /// Processa un logo esterno convertendolo in DataURI
    /// </summary>
    Task<IconGenerationResultDto?> ProcessExternalLogoAsync(string logoUrl);
}
