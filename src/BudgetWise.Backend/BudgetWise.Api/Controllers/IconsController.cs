using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using BudgetWise.Core.Interfaces;
using BudgetWise.Core.DTOs;

namespace BudgetWise.Api.Controllers;

/// <summary>
/// Controller per la generazione di icone tramite AI
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Tags("Icons")]
// [Authorize] // Temporaneamente disabilitato per test
public class IconsController : ControllerBase
{
    private readonly IIconGenerationService _iconService;
    private readonly ILogger<IconsController> _logger;

    public IconsController(
        IIconGenerationService iconService,
        ILogger<IconsController> logger)
    {
        _iconService = iconService;
        _logger = logger;
    }

    /// <summary>
    /// Genera un'icona personalizzata tramite AI
    /// </summary>
    /// <param name="request">Parametri per la generazione dell'icona</param>
    /// <returns>Icona generata in formato dataURI con colore suggerito</returns>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(IconGenerationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<IconGenerationResultDto>> GenerateIcon([FromBody] IconGenerationRequestDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length < 2)
            {
                return BadRequest("Il nome deve essere di almeno 2 caratteri");
            }

            _logger.LogInformation("Generazione icona AI per: {Name}, Stile: {Style}", request.Name, request.Style);

            var result = await _iconService.GenerateIconAsync(request);
            
            if (result == null)
            {
                _logger.LogWarning("Generazione icona fallita per: {Name}", request.Name);
                return StatusCode(503, "Servizio di generazione AI temporaneamente non disponibile");
            }

            _logger.LogInformation("Icona generata con successo per: {Name}", request.Name);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nella generazione icona per: {Name}", request.Name);
            return StatusCode(500, "Errore interno del server");
        }
    }

    /// <summary>
    /// Carica un'icona personalizzata dell'utente
    /// </summary>
    /// <param name="request">Dati dell'icona da caricare</param>
    /// <returns>URL dell'icona caricata</returns>
    [HttpPost("upload")]
    [ProducesResponseType(typeof(IconUploadResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<IconUploadResultDto>> UploadIcon([FromBody] IconUploadRequestDto request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.DataUri))
            {
                return BadRequest("DataURI dell'icona richiesto");
            }

            var userId = User.FindFirst("sub")?.Value ?? 
                        User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Token di autenticazione non valido");
            }

            _logger.LogInformation("Upload icona per utente: {UserId}", userId);

            var result = await _iconService.UploadIconAsync(request, userId);
            
            _logger.LogInformation("Icona caricata con ID: {IconId}", result.IconId);
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Errore nell'upload icona per utente");
            return StatusCode(500, "Errore interno del server");
        }
    }
}
