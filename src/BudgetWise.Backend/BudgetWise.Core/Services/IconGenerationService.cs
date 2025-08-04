using BudgetWise.Core.Interfaces;
using BudgetWise.Core.DTOs;
using Microsoft.Extensions.Logging;

namespace BudgetWise.Core.Services;

/// <summary>
/// Servizio per la generazione automatica di icone tramite AI
/// </summary>
public class IconGenerationService : IIconGenerationService
{
    private readonly ILogger<IconGenerationService> _logger;

    public IconGenerationService(ILogger<IconGenerationService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Genera un'icona tramite AI
    /// </summary>
    public async Task<IconGenerationResultDto?> GenerateIconAsync(IconGenerationRequestDto request)
    {
        try
        {
            _logger.LogInformation("Generazione icona AI per: {Name}", request.Name);

            // TODO: Implementare integrazione con servizio AI per generazione icone
            // Per ora restituisco un placeholder
            
            await Task.Delay(1000); // Simula chiamata API

            var placeholderIcon = GeneratePlaceholderIcon(request.Name);
            var color = GetDefaultColorForBrand(request.Name);

            return new IconGenerationResultDto
            {
                DataUri = placeholderIcon,
                Color = color
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nella generazione icona AI per: {Name}", request.Name);
            return null;
        }
    }

    /// <summary>
    /// Carica un'icona personalizzata
    /// </summary>
    public async Task<IconUploadResultDto> UploadIconAsync(IconUploadRequestDto request, string userId)
    {
        try
        {
            _logger.LogInformation("Upload icona personalizzata, utente: {UserId}", userId);

            // TODO: Implementare logica di salvataggio file
            // - Validazione formato (SVG, PNG, JPG)
            // - Ridimensionamento automatico
            // - Compressione
            // - Salvataggio su storage

            await Task.Delay(500); // Simula elaborazione

            var iconId = Guid.NewGuid().ToString();
            var iconUrl = $"/api/icons/custom/{iconId}";

            return new IconUploadResultDto
            {
                IconId = iconId,
                IconUrl = iconUrl
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nell'upload icona, utente: {UserId}", userId);
            
            return new IconUploadResultDto
            {
                IconId = string.Empty,
                IconUrl = string.Empty
            };
        }
    }

    /// <summary>
    /// Genera un'icona placeholder basata sul nome del brand
    /// </summary>
    private string GeneratePlaceholderIcon(string brandName)
    {
        var initials = GetBrandInitials(brandName);
        var backgroundColor = GetDefaultColorForBrand(brandName);
        var textColor = GetContrastColor(backgroundColor);

        // Genera un SVG semplice con le iniziali
        var svg = $@"
<svg width=""64"" height=""64"" viewBox=""0 0 64 64"" xmlns=""http://www.w3.org/2000/svg"">
    <rect width=""64"" height=""64"" rx=""8"" fill=""{backgroundColor}""/>
    <text x=""32"" y=""40"" font-family=""Arial, sans-serif"" font-size=""24"" font-weight=""bold"" 
          text-anchor=""middle"" fill=""{textColor}"">{initials}</text>
</svg>";

        // Converti in data URI
        var base64 = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(svg));
        return $"data:image/svg+xml;base64,{base64}";
    }

    /// <summary>
    /// Ottiene le iniziali del brand (max 2 caratteri)
    /// </summary>
    private string GetBrandInitials(string brandName)
    {
        if (string.IsNullOrWhiteSpace(brandName))
            return "??";

        var words = brandName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        
        if (words.Length >= 2)
        {
            return $"{words[0][0]}{words[1][0]}".ToUpperInvariant();
        }
        
        return brandName.Length >= 2 
            ? brandName.Substring(0, 2).ToUpperInvariant()
            : brandName.ToUpperInvariant().PadRight(2, '?');
    }

    /// <summary>
    /// Ottiene un colore predefinito basato sul nome del brand
    /// </summary>
    private string GetDefaultColorForBrand(string brandName)
    {
        var colors = new[]
        {
            "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
            "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
        };

        var hash = brandName.GetHashCode();
        var index = Math.Abs(hash) % colors.Length;
        return colors[index];
    }

    /// <summary>
    /// Ottiene un colore di contrasto (bianco o nero) per un colore di sfondo
    /// </summary>
    private string GetContrastColor(string backgroundColor)
    {
        // Rimuovi il # se presente
        var color = backgroundColor.TrimStart('#');
        
        if (color.Length != 6)
            return "#FFFFFF";

        // Converti hex in RGB
        var r = Convert.ToInt32(color.Substring(0, 2), 16);
        var g = Convert.ToInt32(color.Substring(2, 2), 16);
        var b = Convert.ToInt32(color.Substring(4, 2), 16);

        // Calcola luminanza
        var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Ritorna bianco per colori scuri, nero per colori chiari
        return luminance > 0.5 ? "#000000" : "#FFFFFF";
    }
}
