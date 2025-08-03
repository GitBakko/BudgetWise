# 🏛️ ARCHITETTURA BACKEND OBBLIGATORIA

## ⚠️ **ATTENZIONE SVILUPPATORI**

Questo progetto implementa una **Clean Architecture** con **Repository Pattern** che è **OBBLIGATORIA** e **INVIOLABILE**.

### 📖 **DOCUMENTAZIONE COMPLETA**
👉 **[BACKEND-ARCHITECTURE.md](./BACKEND-ARCHITECTURE.md)** 👈

## 🚨 **REGOLE FONDAMENTALI**

### ✅ **SEMPRE OBBLIGATORIO**
1. **Entity Framework Core 9 ESCLUSIVO** - Nessun altro metodo di accesso dati
2. **Repository Pattern** - Ogni entità ha il suo repository
3. **Dependency Injection** - Tutti i servizi registrati in Program.cs
4. **DTOs per API** - Mai esporre entità Entity Framework
5. **Separazione Layer** - API → Core → Data

### ❌ **SEVERAMENTE VIETATO**
1. **SqlConnection/SqlCommand** - Solo Entity Framework
2. **DbContext nei Controller** - Solo nei Repository
3. **Business Logic nei Controller** - Solo nei Service
4. **Dipendenze Circolari** - Rispettare flusso Data → Core → API
5. **Entità EF nelle API** - Solo DTOs

## 🏗️ **STRUTTURA PROGETTI**

```
BudgetWise.Api/          # 🌐 Presentation Layer
├── Controllers/         #    HTTP endpoints
└── Program.cs          #    DI configuration

BudgetWise.Core/        # 🧠 Business Logic Layer  
├── Services/           #    Business logic
├── Interfaces/         #    Service contracts
└── DTOs/              #    Data transfer objects

BudgetWise.Data/        # 🗄️ Data Access Layer
├── Models/             #    EF Core entities
├── Repositories/       #    Data access implementations
├── Interfaces/         #    Repository contracts
└── *DbContext.cs      #    EF configurations
```

## 🔗 **FLUSSO OBBLIGATORIO**

```
HTTP Request → Controller → IService → Service → IRepository → Repository → EF Core → Database
```

## 📋 **CHECKLIST PRE-COMMIT**

Prima di ogni commit, verificare:

- [ ] ✅ Usato solo Entity Framework Core 9
- [ ] ✅ Repository Pattern implementato correttamente
- [ ] ✅ Dependency Injection configurato
- [ ] ✅ DTOs utilizzati per tutte le API
- [ ] ✅ Nessuna business logic nei Controller
- [ ] ✅ Nessun DbContext nei Controller
- [ ] ✅ Navigation Properties utilizzate correttamente
- [ ] ✅ Logging strutturato implementato

## 🎯 **ESEMPIO VELOCE**

### ✅ **CORRETTO**
```csharp
// Controller
public class AccountsController : ControllerBase
{
    private readonly IAccountService _accountService; // ✅ Service via DI
    
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AccountResponseDto>>> GetAccounts()
    {
        return await _accountService.GetAccountsAsync(userId); // ✅ DTO response
    }
}

// Service  
public class AccountService : IAccountService
{
    private readonly IAccountRepository _accountRepository; // ✅ Repository via DI
    
    public async Task<IEnumerable<AccountResponseDto>> GetAccountsAsync(string userId)
    {
        var accounts = await _accountRepository.GetAccountsByUserIdAsync(userId);
        return accounts.Select(a => new AccountResponseDto { ... }); // ✅ Entity→DTO
    }
}

// Repository
public class AccountRepository : IAccountRepository
{
    private readonly BudgetWiseDbContext _context; // ✅ EF Core context
    
    public async Task<IEnumerable<Account>> GetAccountsByUserIdAsync(string userId)
    {
        return await _context.Accounts
            .Where(a => a.UserId == userId)
            .Include(a => a.Transactions) // ✅ Navigation properties
            .ToListAsync(); // ✅ Solo EF Core
    }
}
```

### ❌ **VIETATO**
```csharp
// ❌ DbContext nel Controller
public class AccountsController : ControllerBase
{
    private readonly BudgetWiseDbContext _context; // ❌ NO!
}

// ❌ SQL diretto
using var connection = new SqlConnection(...); // ❌ NO!
var command = new SqlCommand(...); // ❌ NO!

// ❌ Entità EF nelle API
public async Task<Account> GetAccount() // ❌ NO! Usare DTO

// ❌ Business logic nei Controller
var total = accounts.Sum(a => a.Balance); // ❌ NO! Va nel Service
```

## 🚨 **ENFORCEMENT**

**Qualsiasi deviazione da questa architettura:**
- ❌ **NON sarà accettata** nei code review
- ❌ **DOVRÀ essere riscritta** completamente  
- ❌ **BLOCCHERÀ** il deployment

## 📞 **SUPPORTO**

Per domande consultare:
1. 📖 **[BACKEND-ARCHITECTURE.md](./BACKEND-ARCHITECTURE.md)** - Documentazione completa
2. 👥 **Team Lead** - Per chiarimenti architetturali

---

## 🛡️ **RICORDA**

> **"Better safe than sorry - seguire sempre l'architettura!"**

**Non ci sono eccezioni a queste regole architetturali.**
