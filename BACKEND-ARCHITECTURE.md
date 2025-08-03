# BudgetWise Backend Architecture

## 📋 **OVERVIEW**

Il backend di BudgetWise implementa una **Clean Architecture** con **Repository Pattern** utilizzando **.NET 9** e **Entity Framework Core 9**. Questa architettura è **OBBLIGATORIA** e deve essere seguita **SENZA ALCUNA DEROGA** durante tutto lo sviluppo.

## 🏗️ **PATTERN ARCHITETTURALE**

### Repository Pattern + Clean Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Layer     │ -> │   Core Layer    │ -> │   Data Layer    │
│  (Controllers)  │    │   (Services)    │    │ (Repositories)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 **STRUTTURA PROGETTI**

### **BudgetWise.Api** - Presentation Layer
```
BudgetWise.Api/
├── Controllers/          # API Controllers
│   ├── AuthController.cs
│   └── AccountsController.cs
├── Program.cs           # DI Configuration
└── Properties/
```

**RESPONSABILITÀ:**
- ✅ Gestione HTTP requests/responses
- ✅ Autenticazione/Autorizzazione
- ✅ Validazione input
- ✅ Configurazione Dependency Injection
- ❌ **MAI** logica di business
- ❌ **MAI** accesso diretto ai dati

### **BudgetWise.Core** - Business Logic Layer
```
BudgetWise.Core/
├── Services/            # Business Logic Implementation
│   └── AccountService.cs
├── Interfaces/          # Service Contracts
│   ├── IAccountService.cs
│   ├── IAuthService.cs
│   └── [altri servizi...]
├── DTOs/               # Data Transfer Objects
│   ├── AccountDTOs.cs
│   ├── AuthDtos.cs
│   └── [altri DTOs...]
└── Infrastructure/     # Core Infrastructure
```

**RESPONSABILITÀ:**
- ✅ Logica di business
- ✅ Validazioni complesse
- ✅ Orchestrazione operazioni
- ✅ Mapping entità ↔ DTOs
- ❌ **MAI** accesso diretto al database
- ❌ **MAI** dipendenze da framework esterni

### **BudgetWise.Data** - Data Access Layer
```
BudgetWise.Data/
├── Models/             # Entity Framework Models
│   ├── Account.cs
│   ├── Transaction.cs
│   ├── ApplicationUser.cs
│   └── [tutte le entità...]
├── Repositories/       # Repository Implementations
│   └── AccountRepository.cs
├── Interfaces/         # Repository Contracts
│   └── IAccountRepository.cs
├── BudgetWiseDbContext.cs
└── IdentityBudgetWiseDbContext.cs
```

**RESPONSABILITÀ:**
- ✅ Accesso ai dati tramite Entity Framework Core 9
- ✅ Implementazione Repository Pattern
- ✅ Configurazione DbContext
- ✅ Navigation Properties
- ❌ **MAI** logica di business
- ❌ **MAI** chiamate dirette da API

## 🔗 **FLUSSO DATI OBBLIGATORIO**

```
HTTP Request
     ↓
Controller (API Layer)
     ↓
Service Interface (Core)
     ↓
Service Implementation (Core)
     ↓
Repository Interface (Data)
     ↓
Repository Implementation (Data)
     ↓
Entity Framework Core 9
     ↓
SQL Server Database
```

## ⚡ **DEPENDENCY INJECTION PATTERN**

### Registrazione Servizi (Program.cs)
```csharp
// Entity Framework
builder.Services.AddDbContext<BudgetWiseDbContext>(options =>
    options.UseSqlServer(connectionString));

// Repository Pattern
builder.Services.AddScoped<IAccountRepository, AccountRepository>();
builder.Services.AddScoped<IAccountService, AccountService>();
```

### Iniezione nei Controller
```csharp
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;
    
    public AccountsController(IAccountService accountService)
    {
        _accountService = accountService;
    }
}
```

### Iniezione nei Service
```csharp
public class AccountService : IAccountService
{
    private readonly IAccountRepository _accountRepository;
    
    public AccountService(IAccountRepository accountRepository)
    {
        _accountRepository = accountRepository;
    }
}
```

## 🛡️ **REGOLE ARCHITETTURALI INVIOLABILI**

### ✅ **OBBLIGATORIO**

1. **Entity Framework Core 9 ESCLUSIVO**
   - Utilizzare SOLO Entity Framework Core per accesso dati
   - VIETATO: SqlConnection, SqlCommand, Dapper, raw SQL

2. **Repository Pattern SEMPRE**
   - Ogni entità deve avere il suo Repository
   - Repository implementa Interface in Data layer
   - Service usa Repository via Interface

3. **Dependency Injection SEMPRE**
   - Registrare tutti i servizi in Program.cs
   - Iniettare dipendenze via constructor
   - VIETATO: new(), static classes per business logic

4. **Separazione Responsabilità**
   - API Layer: Solo HTTP concerns
   - Core Layer: Solo business logic
   - Data Layer: Solo accesso dati

5. **DTOs per Communication**
   - API ↔ Core: sempre DTOs
   - VIETATO: esporre entità Entity Framework

### ❌ **SEVERAMENTE VIETATO**

1. **Accesso Diretto al Database**
   ```csharp
   // ❌ VIETATO
   using var connection = new SqlConnection(...)
   var command = new SqlCommand(...)
   ```

2. **DbContext nei Controller**
   ```csharp
   // ❌ VIETATO
   public class Controller : ControllerBase
   {
       private readonly BudgetWiseDbContext _context; // NO!
   }
   ```

3. **Business Logic nei Controller**
   ```csharp
   // ❌ VIETATO
   public async Task<IActionResult> GetAccounts()
   {
       var accounts = await _context.Accounts
           .Where(a => a.UserId == userId)
           .Sum(a => a.Balance); // Business logic nei controller NO!
   }
   ```

4. **Entità Entity Framework nelle API**
   ```csharp
   // ❌ VIETATO
   public async Task<Account> GetAccount() // Entità EF esposta NO!
   ```

5. **Dipendenze Circolari**
   - Core non può referenziare Data direttamente
   - Usare Interfaces per comunicazione

## 🎯 **ESEMPIO IMPLEMENTAZIONE CORRETTA**

### 1. Entity (Data Layer)
```csharp
// BudgetWise.Data/Models/Account.cs
public class Account
{
    public Guid Id { get; set; }
    public string UserId { get; set; }
    public string Name { get; set; }
    public List<Transaction> Transactions { get; set; } = new();
}
```

### 2. Repository Interface (Data Layer)
```csharp
// BudgetWise.Data/Interfaces/IAccountRepository.cs
public interface IAccountRepository
{
    Task<IEnumerable<Account>> GetAccountsByUserIdAsync(string userId);
    Task<Account?> GetAccountByIdAsync(Guid accountId, string userId);
    Task<Account> CreateAccountAsync(Account account);
}
```

### 3. Repository Implementation (Data Layer)
```csharp
// BudgetWise.Data/Repositories/AccountRepository.cs
public class AccountRepository : IAccountRepository
{
    private readonly BudgetWiseDbContext _context;
    
    public async Task<IEnumerable<Account>> GetAccountsByUserIdAsync(string userId)
    {
        return await _context.Accounts
            .Where(a => a.UserId == userId)
            .Include(a => a.Transactions)
            .ToListAsync();
    }
}
```

### 4. DTO (Core Layer)
```csharp
// BudgetWise.Core/DTOs/AccountDTOs.cs
public class AccountResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public decimal CurrentBalance { get; set; }
}
```

### 5. Service Interface (Core Layer)
```csharp
// BudgetWise.Core/Interfaces/IAccountService.cs
public interface IAccountService
{
    Task<IEnumerable<AccountResponseDto>> GetAccountsAsync(string userId);
}
```

### 6. Service Implementation (Core Layer)
```csharp
// BudgetWise.Core/Services/AccountService.cs
public class AccountService : IAccountService
{
    private readonly IAccountRepository _accountRepository;
    
    public async Task<IEnumerable<AccountResponseDto>> GetAccountsAsync(string userId)
    {
        var accounts = await _accountRepository.GetAccountsByUserIdAsync(userId);
        
        return accounts.Select(account => new AccountResponseDto
        {
            Id = account.Id,
            Name = account.Name,
            CurrentBalance = account.Transactions
                .Sum(t => t.Type == "Income" ? t.Amount : -t.Amount)
        });
    }
}
```

### 7. Controller (API Layer)
```csharp
// BudgetWise.Api/Controllers/AccountsController.cs
[ApiController]
[Route("api/[controller]")]
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService;
    
    public AccountsController(IAccountService accountService)
    {
        _accountService = accountService;
    }
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountResponseDto>>> GetAccounts()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var accounts = await _accountService.GetAccountsAsync(userId);
        return Ok(accounts);
    }
}
```

## 🔧 **TECNOLOGIE OBBLIGATORIE**

- **.NET 9** - Framework di base
- **Entity Framework Core 9** - ORM esclusivo
- **ASP.NET Core Identity** - Autenticazione
- **SQL Server** - Database
- **Serilog** - Logging strutturato
- **Scalar/OpenAPI** - Documentazione API

## 📋 **CHECKLIST CONFORMITÀ**

Prima di ogni commit, verificare:

- [ ] Usato solo Entity Framework Core 9
- [ ] Repository Pattern implementato
- [ ] Dependency Injection configurato
- [ ] DTOs utilizzati per API
- [ ] Nessuna business logic nei Controller
- [ ] Nessun DbContext nei Controller
- [ ] Logging strutturato implementato
- [ ] Navigation Properties utilizzate
- [ ] Nessuna dipendenza circolare

## 🚨 **ENFORCEMENT**

**Questa architettura è OBBLIGATORIA e INVIOLABILE.**

Qualsiasi deviazione da questi pattern:
- ❌ Non sarà accettata nei code review
- ❌ Dovrà essere riscritta completamente
- ❌ Bloccherà il deployment

**Non ci sono eccezioni a queste regole architetturali.**

---

## 📞 **SUPPORTO**

Per domande sull'architettura o implementazione corretta dei pattern, consultare questa documentazione o chiedere al team lead.

**Ricorda: Better safe than sorry - seguire sempre l'architettura!** 🛡️
