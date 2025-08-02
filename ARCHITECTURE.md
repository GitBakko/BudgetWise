# BudgetWise Architecture - Modern Angular + .NET

## 🏗️ **Architecture Philosophy**

**MODERN ARCHITECTURE MANDATE**: This system uses **Angular 20 Signals + .NET 9** with strict adherence to modern patterns.

### 🎯 **Core Principles**
1. **Frontend**: 100% Angular Signals (NO BehaviorSubject/Observable state)
2. **HTTP**: Async/Await + Promises (NO Observable chains)  
3. **Backend**: .NET 9 Web API with JWT authentication
4. **State**: Signal-based reactive programming
5. **API**: RESTful endpoints with proper HTTP status codes

---

## 🏛️ **System Overview**

```plantuml
@startuml
!theme spacelab

actor "User" as User

package "Frontend - Angular 20" {
  [**Angular Client**\nSignals + Async/Await\nTailwind CSS] as Frontend
  
  package "Angular Architecture" {
    [**Auth Service**\nSignals + JWT] as AuthService
    [**Auth Guard**\nSignal-based] as AuthGuard
    [**Components**\nSignal Reactive] as Components
  }
}

package "Backend - .NET 9" {
    [**.NET Web API**\nASP.NET Core 8\nJWT Auth] as Backend
    
    package "API Layers" {
        [**Controllers**\nAuth, Accounts, Transactions] as Controllers
        [**Services**\nBusiness Logic] as Services
        [**Data Layer**\nEntity Framework] as DataLayer
    }
}

package "Database" {
    database "SQL Server" as DB
}

package "Firebase" {
  database "SQL SERVER 2019" as Db
  [JWT Bearer token] as JWT
}

package "API Esterne" {
    [**bw.epartner.it**\nImage Storage, Brand API] as EpartnerAPI
    [**Brandfetch API**\nLogo Search] as BrandfetchAPI
}

User -right-> Frontend : "Interagisce con la UI"

Frontend -down-> Backend : "Chiama Server Actions (es. addTransaction)"
Backend -up-> Frontend : "Renderizza Server Components (HTML)"

Backend -down-> DB SQL : "Legge/Scrive Dati\n(Profili, Conti, Transazioni, etc.)"
Backend -> JWT : "Verifica Utenti e Ruoli"
Backend -down-> AI : "Invoca Flussi AI\n(es. Analisi Scontrino, Suggerimenti)"

AI -up-> Backend : "Restituisce Risultati\n(JSON, Immagini, Testo)"

Backend -right-> EpartnerAPI : "Carica/Recupera Immagini\n(es. avatar, loghi)"
Backend -right-> BrandfetchAPI : "Cerca Loghi Brand"

@enduml
```

---

## 🔧 **CONFIGURAZIONE TECNICA**

### **Development Environment**

- **Frontend**: <http://localhost:4200> (Angular dev server)
- **Backend**: <https://localhost:7268> (ASP.NET Core)
- **Database**: SQL Server (via MCP server integration)
- **Logging**: Seq dashboard + structured logging

### **Test User Credentials**

- **Email**: `bakko.posta@gmail.com`
- **Password**: `PassBakko1983@`

### **Development Workflow**

1. **Backend**: Start .NET API → Verify health endpoint
2. **Database**: Ensure MCP server connection active
3. **Frontend**: Start Angular dev server → Test authentication flow