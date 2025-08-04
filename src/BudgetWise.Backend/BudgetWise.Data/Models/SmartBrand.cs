using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BudgetWise.Data.Models;

/// <summary>
/// Modello per brand intelligenti con integrazione Brandfetch
/// </summary>
[Table("SmartBrands")]
public class SmartBrand
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string NameLowercase { get; set; } = null!;

    [MaxLength(200)]
    public string? Domain { get; set; }

    [MaxLength(100)]
    public string? ExternalId { get; set; } // ID da Brandfetch

    [MaxLength(500)]
    public string? Website { get; set; }

    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    public string? PrimaryColor { get; set; }

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    [MaxLength(100)]
    public string? CreatedByUid { get; set; }

    [MaxLength(100)]
    public string? CreatedByDisplayName { get; set; }

    /// <summary>
    /// Metadati aggiuntivi da Brandfetch (JSON)
    /// </summary>
    public string? Metadata { get; set; }
}
