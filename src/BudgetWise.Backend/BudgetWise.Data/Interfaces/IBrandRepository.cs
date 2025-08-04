using BudgetWise.Data.Models;

namespace BudgetWise.Data.Interfaces;

/// <summary>
/// Repository per la gestione dei brand intelligenti
/// </summary>
public interface IBrandRepository
{
    /// <summary>
    /// Cerca brand per nome
    /// </summary>
    Task<IEnumerable<SmartBrand>> SearchByNameAsync(string name);
    
    /// <summary>
    /// Ottiene un brand per nome esatto
    /// </summary>
    Task<SmartBrand?> GetByNameAsync(string name);
    
    /// <summary>
    /// Ottiene un brand per ID esterno (Brandfetch)
    /// </summary>
    Task<SmartBrand?> GetByExternalIdAsync(string externalId);
    
    /// <summary>
    /// Crea un nuovo brand
    /// </summary>
    Task<SmartBrand> CreateAsync(SmartBrand brand);
    
    /// <summary>
    /// Aggiorna un brand esistente
    /// </summary>
    Task<SmartBrand> UpdateAsync(SmartBrand brand);
    
    /// <summary>
    /// Elimina un brand
    /// </summary>
    Task<bool> DeleteAsync(Guid id);
    
    /// <summary>
    /// Ottiene tutti i brand attivi
    /// </summary>
    Task<IEnumerable<SmartBrand>> GetActiveAsync();
}
