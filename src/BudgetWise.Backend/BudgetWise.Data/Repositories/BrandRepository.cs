using Microsoft.EntityFrameworkCore;
using BudgetWise.Data.Models;
using BudgetWise.Data.Interfaces;

namespace BudgetWise.Data.Repositories;

/// <summary>
/// Repository per la gestione dei brand intelligenti nel database
/// </summary>
public class BrandRepository : IBrandRepository
{
    private readonly BudgetWiseDbContext _context;

    public BrandRepository(BudgetWiseDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Cerca brand per nome (ricerca fuzzy)
    /// </summary>
    public async Task<IEnumerable<SmartBrand>> SearchByNameAsync(string name)
    {
        var searchTerm = name.ToLowerInvariant();
        
        return await _context.SmartBrands
            .Where(b => b.IsActive && 
                       (b.NameLowercase.Contains(searchTerm) ||
                        (b.Domain != null && b.Domain.ToLower().Contains(searchTerm)) ||
                        (b.Website != null && b.Website.ToLower().Contains(searchTerm))))
            .OrderBy(b => b.NameLowercase.StartsWith(searchTerm) ? 0 : 1) // Priorità ai match che iniziano con il termine
            .ThenBy(b => b.Name)
            .Take(10)
            .ToListAsync();
    }

    /// <summary>
    /// Ottiene un brand per nome esatto
    /// </summary>
    public async Task<SmartBrand?> GetByNameAsync(string name)
    {
        var nameLowercase = name.ToLowerInvariant();
        return await _context.SmartBrands
            .FirstOrDefaultAsync(b => b.IsActive && b.NameLowercase == nameLowercase);
    }

    /// <summary>
    /// Ottiene un brand per ID esterno (Brandfetch)
    /// </summary>
    public async Task<SmartBrand?> GetByExternalIdAsync(string externalId)
    {
        return await _context.SmartBrands
            .FirstOrDefaultAsync(b => b.IsActive && b.ExternalId == externalId);
    }

    /// <summary>
    /// Crea un nuovo brand
    /// </summary>
    public async Task<SmartBrand> CreateAsync(SmartBrand brand)
    {
        brand.Id = Guid.NewGuid();
        brand.CreatedAt = DateTimeOffset.UtcNow;
        brand.NameLowercase = brand.Name.ToLowerInvariant();
        brand.IsActive = true;

        _context.SmartBrands.Add(brand);
        await _context.SaveChangesAsync();

        return brand;
    }

    /// <summary>
    /// Aggiorna un brand esistente
    /// </summary>
    public async Task<SmartBrand> UpdateAsync(SmartBrand brand)
    {
        brand.NameLowercase = brand.Name.ToLowerInvariant();
        brand.UpdatedAt = DateTimeOffset.UtcNow;

        _context.SmartBrands.Update(brand);
        await _context.SaveChangesAsync();

        return brand;
    }

    /// <summary>
    /// Elimina un brand (soft delete)
    /// </summary>
    public async Task<bool> DeleteAsync(Guid id)
    {
        var brand = await _context.SmartBrands.FindAsync(id);
        if (brand == null)
        {
            return false;
        }

        brand.IsActive = false;
        brand.UpdatedAt = DateTimeOffset.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    /// <summary>
    /// Ottiene tutti i brand attivi
    /// </summary>
    public async Task<IEnumerable<SmartBrand>> GetActiveAsync()
    {
        return await _context.SmartBrands
            .Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .ToListAsync();
    }
}
