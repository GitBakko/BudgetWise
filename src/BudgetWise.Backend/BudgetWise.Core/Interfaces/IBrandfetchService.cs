namespace BudgetWise.Core.Interfaces;

/// <summary>
/// Interfaccia per il servizio di integrazione con Brandfetch
/// Riferimento: BRANDFETCH-INTEGRATION.md - Ricerca e recupero loghi brand
/// </summary>
public interface IBrandfetchService
{
    /// <summary>
    /// Cerca brand tramite nome (endpoint pubblico)
    /// Riferimento: BRANDFETCH-INTEGRATION.md - Fase 1: Ricerca Brand
    /// </summary>
    Task<IEnumerable<BrandSuggestion>> SearchBrandsAsync(string companyName);
    
    /// <summary>
    /// Ottiene i dettagli completi di un brand (endpoint autenticato)
    /// Riferimento: BRANDFETCH-INTEGRATION.md - Fase 2: Recupero Dettagli Brand
    /// </summary>
    Task<BrandDetails?> GetBrandDetailsAsync(string brandId);
}

/// <summary>
/// Risultato della ricerca brand
/// Riferimento: BRANDFETCH-INTEGRATION.md - Array di BrandSuggestion
/// </summary>
public class BrandSuggestion
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Domain { get; set; }
    public string? LogoUrl { get; set; }
    public string? Icon { get; set; }
}

/// <summary>
/// Dettagli completi di un brand
/// Riferimento: BRANDFETCH-INTEGRATION.md - Oggetto JSON BrandDetails
/// </summary>
public class BrandDetails
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string Domain { get; set; }
    public string? Description { get; set; }
    public IEnumerable<BrandLogo> Logos { get; set; } = new List<BrandLogo>();
    public IEnumerable<BrandColor> Colors { get; set; } = new List<BrandColor>();
    public IEnumerable<string> Links { get; set; } = new List<string>();
}

/// <summary>
/// Logo di un brand
/// </summary>
public class BrandLogo
{
    public required string Type { get; set; } // "logo", "icon", "symbol"
    public required string Theme { get; set; } // "light", "dark", "neutral"
    public required string Format { get; set; } // "png", "jpg", "svg"
    public IEnumerable<BrandLogoSize> Sizes { get; set; } = new List<BrandLogoSize>();
}

/// <summary>
/// Dimensione specifica di un logo
/// </summary>
public class BrandLogoSize
{
    public int Width { get; set; }
    public int Height { get; set; }
    public required string Url { get; set; }
}

/// <summary>
/// Colore di un brand
/// </summary>
public class BrandColor
{
    public required string Hex { get; set; }
    public required string Type { get; set; } // "primary", "secondary", "accent"
    public int Brightness { get; set; }
}
