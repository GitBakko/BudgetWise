using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using BudgetWise.Core.DTOs;
using BudgetWise.Core.Interfaces;
using BudgetWise.Data.Interfaces;

namespace BudgetWise.Core.Services;

/// <summary>
/// Servizio per la gestione dei brand e integrazione Brandfetch
/// Implementa il flusso descritto nella guida tecnica
/// </summary>
public class BrandService : IBrandService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BrandService> _logger;
    private readonly IBrandRepository _brandRepository;
    
    // Configurazione Brandfetch
    private readonly string _brandfetchApiKey;
    private readonly string _brandfetchClientId;
    private readonly string _brandfetchBaseUrl = "https://api.brandfetch.io/v2";

    public BrandService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<BrandService> logger,
        IBrandRepository brandRepository)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _brandRepository = brandRepository;
        
        // Ottieni la chiave API da configurazione
        _brandfetchApiKey = configuration["Brandfetch:ApiKey"] ?? 
            throw new InvalidOperationException("Brandfetch API key non configurata");
        
        _brandfetchClientId = configuration["Brandfetch:ClientId"] ?? 
            throw new InvalidOperationException("Brandfetch Client ID non configurato");

        // Configura HttpClient per Brandfetch (Bearer token solo per Brand Details API)
        _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_brandfetchApiKey}");
        _httpClient.Timeout = TimeSpan.FromSeconds(10);
    }

    /// <summary>
    /// Cerca brand nel database locale (Brand Hub)
    /// </summary>
    public async Task<IEnumerable<BrandSuggestionDto>> SearchLocalBrandsAsync(string name)
    {
        try
        {
            _logger.LogInformation("Ricerca brand locale per: {Name}", name);
            
            var brands = await _brandRepository.SearchByNameAsync(name);
            
            var results = brands.Select(b => new BrandSuggestionDto
            {
                Id = b.Id.ToString(),
                Name = b.Name,
                LogoUrl = b.LogoUrl ?? GetDefaultLogoDataUri(),
                Color = b.PrimaryColor ?? "#000000",
                Source = "local"
            }).ToList();
            
            _logger.LogInformation("Trovati {Count} brand locali", results.Count);
            
            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nella ricerca brand locale");
            return Enumerable.Empty<BrandSuggestionDto>();
        }
    }

    /// <summary>
    /// Cerca brand tramite Brandfetch Search API v2
    /// Endpoint: GET /v2/search/{name}?c={clientId}
    /// </summary>
    public async Task<IEnumerable<BrandSuggestionDto>> SearchBrandfetchAsync(string name)
    {
        try
        {
            _logger.LogInformation("Ricerca Brandfetch per: {Name}", name);
            
            // Formato corretto della Search API con clientId
            var searchUrl = $"{_brandfetchBaseUrl}/search/{Uri.EscapeDataString(name)}?c={_brandfetchClientId}";
            
            var response = await _httpClient.GetAsync(searchUrl);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Brandfetch Search API returned {StatusCode} for: {Name}", 
                    response.StatusCode, name);
                return Enumerable.Empty<BrandSuggestionDto>();
            }

            var content = await response.Content.ReadAsStringAsync();
            var searchResults = JsonSerializer.Deserialize<BrandfetchSearchResponse[]>(content, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (searchResults == null || !searchResults.Any())
            {
                _logger.LogInformation("Nessun risultato Brandfetch per: {Name}", name);
                return Enumerable.Empty<BrandSuggestionDto>();
            }
            
            var results = searchResults.Take(5).Select(r => new BrandSuggestionDto
            {
                Id = r.BrandId ?? r.Domain ?? r.Name, // Usa BrandId se disponibile
                Name = r.Name,
                LogoUrl = r.Icon ?? GetDefaultLogoDataUri(),
                Color = null, // Sarà ottenuto nel dettaglio se necessario
                Source = "brandfetch"
            }).ToList();
            
            _logger.LogInformation("Trovati {Count} brand Brandfetch", results.Count);
            
            return results;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Errore HTTP nella ricerca Brandfetch per: {Name}", name);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nella ricerca Brandfetch per: {Name}", name);
            return Enumerable.Empty<BrandSuggestionDto>();
        }
    }

    /// <summary>
    /// Ottiene dettagli completi di un brand da Brandfetch
    /// Implementa il getBrandDetailsFlow
    /// </summary>
    public async Task<IconGenerationResultDto?> GetBrandDetailsAsync(string brandId)
    {
        try
        {
            _logger.LogInformation("Recupero dettagli brand: {BrandId}", brandId);
            
            var detailsUrl = $"{_brandfetchBaseUrl}/brands/{Uri.EscapeDataString(brandId)}";
            
            var response = await _httpClient.GetAsync(detailsUrl);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Brandfetch details API returned {StatusCode} for: {BrandId}", 
                    response.StatusCode, brandId);
                return null;
            }
            
            var content = await response.Content.ReadAsStringAsync();
            var brandDetails = JsonSerializer.Deserialize<BrandfetchBrandDetails>(content, 
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            if (brandDetails == null)
            {
                _logger.LogWarning("Nessun dettaglio trovato per brand: {BrandId}", brandId);
                return null;
            }
            
            // Ottieni il miglior logo disponibile
            var logoUrl = ExtractBestLogo(brandDetails);
            
            // Scarica il logo e convertilo in DataURI
            var dataUri = await DownloadAndConvertToDataUri(logoUrl);
            
            // Estrai il colore primario
            var primaryColor = ExtractPrimaryColor(brandDetails);
            
            var result = new IconGenerationResultDto
            {
                DataUri = dataUri,
                Color = primaryColor
            };
            
            // Salva il brand nel database locale per future ricerche
            await SaveBrandToLocal(brandDetails, logoUrl, primaryColor);
            
            _logger.LogInformation("Dettagli brand recuperati per: {BrandId}", brandId);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nel recupero dettagli brand: {BrandId}", brandId);
            return null;
        }
    }

    /// <summary>
    /// Salva un brand nel database locale
    /// </summary>
    public async Task<BrandSuggestionDto> SaveBrandAsync(SaveBrandRequestDto request)
    {
        try
        {
            _logger.LogInformation("Salvataggio brand: {Name}", request.Name);
            
            var brand = await _brandRepository.CreateAsync(new Data.Models.SmartBrand
            {
                Name = request.Name,
                LogoUrl = request.LogoUrl,
                PrimaryColor = request.Color,
                Description = request.Description,
                CreatedAt = DateTimeOffset.UtcNow
            });
            
            return new BrandSuggestionDto
            {
                Id = brand.Id.ToString(),
                Name = brand.Name,
                LogoUrl = brand.LogoUrl ?? GetDefaultLogoDataUri(),
                Color = brand.PrimaryColor ?? "#000000",
                Source = "local"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nel salvataggio brand: {Name}", request.Name);
            throw;
        }
    }

    #region Helper Methods

    private string ExtractBestLogo(BrandfetchBrandDetails details)
    {
        // Nuova struttura: logos[].formats[].src
        // Priorità: logo SVG > logo PNG/WEBP > icon SVG > icon PNG/WEBP
        
        // 1. Cerca logo in formato SVG
        var logoSvg = details.Logos?
            .Where(l => l.Type == "logo")
            .SelectMany(l => l.Formats ?? Array.Empty<BrandfetchFormat>())
            .FirstOrDefault(f => f.Format == "svg");
        
        if (logoSvg != null && !string.IsNullOrEmpty(logoSvg.Src))
        {
            return logoSvg.Src;
        }
        
        // 2. Cerca logo in formato PNG/WEBP di alta qualità
        var logoPng = details.Logos?
            .Where(l => l.Type == "logo")
            .SelectMany(l => l.Formats ?? Array.Empty<BrandfetchFormat>())
            .Where(f => f.Format == "png" || f.Format == "webp")
            .OrderByDescending(f => f.Width * f.Height) // Prendi la qualità più alta
            .FirstOrDefault();
        
        if (logoPng != null && !string.IsNullOrEmpty(logoPng.Src))
        {
            return logoPng.Src;
        }
        
        // 3. Cerca icon in formato SVG
        var iconSvg = details.Logos?
            .Where(l => l.Type == "icon")
            .SelectMany(l => l.Formats ?? Array.Empty<BrandfetchFormat>())
            .FirstOrDefault(f => f.Format == "svg");
        
        if (iconSvg != null && !string.IsNullOrEmpty(iconSvg.Src))
        {
            return iconSvg.Src;
        }
        
        // 4. Cerca icon in formato PNG/WEBP
        var iconPng = details.Logos?
            .Where(l => l.Type == "icon")
            .SelectMany(l => l.Formats ?? Array.Empty<BrandfetchFormat>())
            .Where(f => f.Format == "png" || f.Format == "webp")
            .OrderByDescending(f => f.Width * f.Height)
            .FirstOrDefault();
        
        if (iconPng != null && !string.IsNullOrEmpty(iconPng.Src))
        {
            return iconPng.Src;
        }
        
        // 5. Fallback: usa default
        return GetDefaultLogoDataUri();
    }

    private async Task<string> DownloadAndConvertToDataUri(string imageUrl)
    {
        try
        {
            var imageBytes = await _httpClient.GetByteArrayAsync(imageUrl);
            var mimeType = GetMimeTypeFromUrl(imageUrl);
            var base64 = Convert.ToBase64String(imageBytes);
            return $"data:{mimeType};base64,{base64}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Errore nel download immagine: {Url}", imageUrl);
            return GetDefaultLogoDataUri();
        }
    }

    private string ExtractPrimaryColor(BrandfetchBrandDetails details)
    {
        // Cerca il colore primario/accent nei colori del brand
        var primaryColor = details.Colors?.FirstOrDefault(c => c.Type == "accent")?.Hex ??
                          details.Colors?.OrderByDescending(c => c.Brightness).FirstOrDefault()?.Hex ??
                          "#0066CC"; // Default

        return primaryColor.StartsWith("#") ? primaryColor : $"#{primaryColor}";
    }

    private async Task SaveBrandToLocal(BrandfetchBrandDetails details, string logoUrl, string primaryColor)
    {
        try
        {
            // Verifica se il brand esiste già
            var existing = await _brandRepository.GetByNameAsync(details.Name);
            if (existing != null)
            {
                return;
            }

            await _brandRepository.CreateAsync(new Data.Models.SmartBrand
            {
                Name = details.Name,
                LogoUrl = logoUrl,
                PrimaryColor = primaryColor,
                Description = details.Description,
                ExternalId = details.Domain,
                Domain = details.Domain,
                Website = $"https://{details.Domain}",
                CreatedAt = DateTimeOffset.UtcNow
            });

            _logger.LogInformation("Brand salvato localmente: {Name}", details.Name);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Errore nel salvataggio automatico brand: {Name}", details.Name);
        }
    }

    private string GetMimeTypeFromUrl(string url)
    {
        var extension = Path.GetExtension(url).ToLowerInvariant();
        return extension switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".webp" => "image/webp",
            _ => "image/png"
        };
    }

    private string GetDefaultLogoDataUri() => "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiByeD0iOCIgZmlsbD0iIzAwNjZDQyIvPgo8dGV4dCB4PSIzMiIgeT0iNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPj88L3RleHQ+Cjwvc3ZnPgo=";

    /// <summary>
    /// Processa un logo esterno convertendolo in DataURI sicuro
    /// Evita problemi di CORS e rende l'immagine persistente
    /// </summary>
    public async Task<IconGenerationResultDto?> ProcessExternalLogoAsync(string logoUrl)
    {
        try
        {
            _logger.LogInformation("Processing logo esterno: {LogoUrl}", logoUrl);
            
            // Valida l'URL
            if (!Uri.TryCreate(logoUrl, UriKind.Absolute, out var uri) || 
                (uri.Scheme != "http" && uri.Scheme != "https"))
            {
                _logger.LogWarning("URL logo non valido: {LogoUrl}", logoUrl);
                return null;
            }

            // Download dell'immagine
            var dataUri = await DownloadAndConvertToDataUri(logoUrl);
            if (dataUri == GetDefaultLogoDataUri())
            {
                // Se il download è fallito, restituisci null per permettere fallback
                return null;
            }

            // Estrai un colore di default basato sull'URL (per ora semplice)
            var defaultColor = ExtractColorFromUrl(logoUrl);

            var result = new IconGenerationResultDto
            {
                DataUri = dataUri,
                Color = defaultColor
            };

            _logger.LogInformation("Logo esterno processato con successo: {LogoUrl}", logoUrl);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nel processing logo esterno: {LogoUrl}", logoUrl);
            return null;
        }
    }

    private string ExtractColorFromUrl(string url)
    {
        // Semplice euristica per estrarre colori basati sul dominio
        var domain = new Uri(url).Host.ToLowerInvariant();
        
        return domain switch
        {
            var d when d.Contains("brandfetch") => "#0066CC",
            var d when d.Contains("apple") => "#000000",
            var d when d.Contains("google") => "#4285F4",
            var d when d.Contains("microsoft") => "#00BCF2",
            var d when d.Contains("amazon") => "#FF9900",
            var d when d.Contains("facebook") => "#1877F2",
            var d when d.Contains("twitter") => "#1DA1F2",
            _ => "#0066CC" // Default
        };
    }

    #endregion
}

#region DTOs for Brandfetch API

/// <summary>
/// Response della Search API di Brandfetch v2
/// Formato reale: GET /v2/search/{name}?c={clientId}
/// </summary>
public class BrandfetchSearchResponse
{
    public string Icon { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public bool Claimed { get; set; }
    public string BrandId { get; set; } = string.Empty;
}

/// <summary>
/// Response della Brand API di Brandfetch v2
/// Formato reale: GET /v2/brands/{identifier}
/// </summary>
public class BrandfetchBrandDetails
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Domain { get; set; } = string.Empty;
    public bool Claimed { get; set; }
    public string? Description { get; set; }
    public string? LongDescription { get; set; }
    public BrandfetchLink[]? Links { get; set; }
    public BrandfetchLogo[]? Logos { get; set; }
    public BrandfetchColor[]? Colors { get; set; }
    public BrandfetchFont[]? Fonts { get; set; }
    public BrandfetchImage[]? Images { get; set; }
    public double? QualityScore { get; set; }
    public BrandfetchCompany? Company { get; set; }
    public bool IsNsfw { get; set; }
    public string? Urn { get; set; }
}

public class BrandfetchLink
{
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class BrandfetchLogo
{
    public string Theme { get; set; } = string.Empty; // "dark", "light"
    public BrandfetchFormat[]? Formats { get; set; }
    public object[]? Tags { get; set; }
    public string Type { get; set; } = string.Empty; // "icon", "logo", "symbol"
}

public class BrandfetchFormat
{
    public string Src { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty; // "svg", "png", "webp"
    public int? Height { get; set; }
    public int? Width { get; set; }
    public int? Size { get; set; }
    public string Background { get; set; } = string.Empty; // "transparent", etc.
}

public class BrandfetchColor
{
    public string Hex { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // "accent", "primary", etc.
    public int Brightness { get; set; }
}

public class BrandfetchFont
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Origin { get; set; } = string.Empty;
    public string? OriginId { get; set; }
    public object[]? Weights { get; set; }
}

public class BrandfetchImage
{
    public BrandfetchFormat[]? Formats { get; set; }
    public object[]? Tags { get; set; }
    public string Type { get; set; } = string.Empty;
}

public class BrandfetchCompany
{
    public int Employees { get; set; }
    public BrandfetchFinancialIdentifiers? FinancialIdentifiers { get; set; }
    public int FoundedYear { get; set; }
    public BrandfetchIndustry[]? Industries { get; set; }
    public string Kind { get; set; } = string.Empty;
    public BrandfetchLocation? Location { get; set; }
}

public class BrandfetchFinancialIdentifiers
{
    public string[]? Isin { get; set; }
    public string[]? Ticker { get; set; }
}

public class BrandfetchIndustry
{
    public string Id { get; set; } = string.Empty;
    public int Score { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public BrandfetchIndustryParent? Parent { get; set; }
}

public class BrandfetchIndustryParent
{
    public string Id { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
}

public class BrandfetchLocation
{
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? CountryCode { get; set; }
    public string? Region { get; set; }
    public string? State { get; set; }
    public string? Subregion { get; set; }
}

#endregion
