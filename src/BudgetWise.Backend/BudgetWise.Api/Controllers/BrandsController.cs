using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BudgetWise.Core.Interfaces;
using BudgetWise.Core.DTOs;

namespace BudgetWise.Api.Controllers;

/// <summary>
/// Controller per la gestione dei brand e loghi aziendali
/// Implementa integrazione con Brandfetch API per ricerca intelligente loghi
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Brands")]
// [Authorize] // Temporaneamente disabilitato per test
public class BrandsController : ControllerBase
{
    private readonly IBrandService _brandService;
    private readonly ILogger<BrandsController> _logger;

    public BrandsController(
        IBrandService brandService,
        ILogger<BrandsController> logger)
    {
        _brandService = brandService;
        _logger = logger;
    }

    /// <summary>
    /// Cerca brand nel database locale (Brand Hub)
    /// </summary>
    /// <param name="name">Nome del brand da cercare</param>
    /// <returns>Lista di brand trovati localmente</returns>
    [HttpGet("search")]
    [ProducesResponseType(typeof(IEnumerable<BrandSuggestionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IEnumerable<BrandSuggestionDto>>> SearchLocalBrands([FromQuery] string name)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(name) || name.Length < 2)
            {
                return BadRequest("Il nome deve essere di almeno 2 caratteri");
            }

            _logger.LogInformation("Ricerca brand locale per: {Name}", name);

            var results = await _brandService.SearchLocalBrandsAsync(name);
            
            _logger.LogInformation("Trovati {Count} brand locali per: {Name}", results.Count(), name);
            
            return Ok(results);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nella ricerca brand locale per: {Name}", name);
            return StatusCode(500, "Errore interno del server");
        }
    }

    /// <summary>
    /// Cerca brand tramite Brandfetch API
    /// </summary>
    /// <param name="name">Nome del brand da cercare</param>
    /// <returns>Lista di brand trovati su Brandfetch</returns>
    [HttpGet("brandfetch/search")]
    [ProducesResponseType(typeof(IEnumerable<BrandSuggestionDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IEnumerable<BrandSuggestionDto>>> SearchBrandfetch([FromQuery] string name)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(name) || name.Length < 2)
            {
                return BadRequest("Il nome deve essere di almeno 2 caratteri");
            }

            _logger.LogInformation("Ricerca brand Brandfetch per: {Name}", name);

            var results = await _brandService.SearchBrandfetchAsync(name);
            
            _logger.LogInformation("Trovati {Count} brand Brandfetch per: {Name}", results.Count(), name);
            
            return Ok(results);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Servizio Brandfetch non disponibile per: {Name}", name);
            return StatusCode(503, "Servizio Brandfetch temporaneamente non disponibile");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nella ricerca Brandfetch per: {Name}", name);
            return StatusCode(500, "Errore interno del server");
        }
    }

    /// <summary>
    /// Ottiene dettagli completi di un brand da Brandfetch
    /// Implementa il getBrandDetailsFlow della guida
    /// </summary>
    /// <param name="request">Richiesta con ID del brand</param>
    /// <returns>Dettagli completi del brand con logo e colori</returns>
    [HttpPost("brandfetch/details")]
    [ProducesResponseType(typeof(IconGenerationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IconGenerationResultDto>> GetBrandDetails([FromBody] BrandDetailsRequestDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.BrandId))
            {
                return BadRequest("ID del brand richiesto");
            }

            _logger.LogInformation("Richiesta dettagli brand: {BrandId}", request.BrandId);

            var result = await _brandService.GetBrandDetailsAsync(request.BrandId);
            
            if (result == null)
            {
                _logger.LogWarning("Brand non trovato: {BrandId}", request.BrandId);
                return NotFound("Brand non trovato");
            }

            _logger.LogInformation("Dettagli brand recuperati per: {BrandId}", request.BrandId);
            
            return Ok(result);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Servizio Brandfetch non disponibile per brand: {BrandId}", request.BrandId);
            return StatusCode(503, "Servizio Brandfetch temporaneamente non disponibile");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nel recupero dettagli brand: {BrandId}", request.BrandId);
            return StatusCode(500, "Errore interno del server");
        }
    }

    /// <summary>
    /// Salva un brand nel database locale per future ricerche
    /// </summary>
    /// <param name="request">Dati del brand da salvare</param>
    /// <returns>Brand salvato</returns>
    [HttpPost("save")]
    [ProducesResponseType(typeof(BrandSuggestionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<BrandSuggestionDto>> SaveBrand([FromBody] SaveBrandRequestDto request)
    {
        try
        {
            _logger.LogInformation("Salvataggio brand locale: {Name}", request.Name);

            var savedBrand = await _brandService.SaveBrandAsync(request);
            
            _logger.LogInformation("Brand salvato con ID: {Id}", savedBrand.Id);
            
            return CreatedAtAction(nameof(SearchLocalBrands), new { name = savedBrand.Name }, savedBrand);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nel salvataggio brand: {Name}", request.Name);
            return StatusCode(500, "Errore interno del server");
        }
    }

    /// <summary>
    /// Processa un logo esterno convertendolo in DataURI sicuro
    /// Evita problemi di CORS e rende l'immagine persistente
    /// </summary>
    /// <param name="request">Richiesta con URL del logo</param>
    /// <returns>Logo convertito in DataURI con colore estratto</returns>
    [HttpPost("process-external-logo")]
    [ProducesResponseType(typeof(IconGenerationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IconGenerationResultDto>> ProcessExternalLogo([FromBody] ProcessExternalLogoRequestDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.LogoUrl))
            {
                return BadRequest("URL del logo richiesto");
            }

            _logger.LogInformation("Processing logo esterno: {LogoUrl}", request.LogoUrl);

            var result = await _brandService.ProcessExternalLogoAsync(request.LogoUrl);
            
            if (result == null)
            {
                _logger.LogWarning("Logo esterno non processabile: {LogoUrl}", request.LogoUrl);
                return NotFound("Logo non processabile");
            }

            _logger.LogInformation("Logo esterno processato con successo: {LogoUrl}", request.LogoUrl);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nel processing logo esterno: {LogoUrl}", request.LogoUrl);
            return StatusCode(500, "Errore interno del server");
        }
    }
}
