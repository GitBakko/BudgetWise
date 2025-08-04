using BudgetWise.Core.DTOs;

namespace BudgetWise.Core.Interfaces;

/// <summary>
/// Interfaccia per il servizio di generazione icone
/// </summary>
public interface IIconGenerationService
{
    /// <summary>
    /// Genera un'icona tramite AI
    /// </summary>
    Task<IconGenerationResultDto?> GenerateIconAsync(IconGenerationRequestDto request);
    
    /// <summary>
    /// Carica un'icona personalizzata
    /// </summary>
    Task<IconUploadResultDto> UploadIconAsync(IconUploadRequestDto request, string userId);
}
