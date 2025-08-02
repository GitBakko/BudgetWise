# BudgetWise - Modern Personal Finance Management

**🎯 Status**: Authentication System Complete ✅  
**🚀 Tech Stack**: Angular 20 + .NET 9 + Modern Patterns  
**📅 Last Updated**: August 1, 2025

BudgetWise is a modern personal finance management application built with **100% Modern Angular patterns** (Signals + Async/Await) and .NET 9 Web API.

## 🚨 **IMPORTANT: Development Philosophy**

This project follows **STRICT modern patterns**:
- ✅ **Angular Signals** for ALL state management (NO BehaviorSubject)
- ✅ **Async/Await + Promises** for ALL HTTP operations (NO Observable chains)
- ✅ **Signal-based reactive programming** throughout the application

**📋 See**: `DEVELOPMENT-RULES.md` for mandatory patterns and `DEVELOPMENT-STATUS.md` for current progress.

---

## 🚀 **Quick Start (Development)**

### **Prerequisites**
- Node.js v18+
- .NET 9 SDK
- SQL Server (or access via MCP server)

### **1. Start Backend (.NET 9 Web API)**
```bash
cd src/BudgetWise.Backend/BudgetWise.Api
dotnet restore
dotnet run
```

**🌐 Backend Endpoints** (https://localhost:7268):
- **API Documentation (Scalar)**: `/scalar/v1`
- **Health Check**: `/health`
- **Authentication**: `/api/auth/login`
- **Token Verification**: `/api/auth/verify`

### **2. Start Frontend (Angular 20)**
```bash
cd src/BudgetWise.Frontend
npm install
ng serve
```

**🌐 Frontend**: http://localhost:4200

### **3. Test Authentication Flow**
1. Navigate to http://localhost:4200
2. Try accessing `/dashboard` → Should redirect to login
3. Login with: `bakko.posta@gmail.com` / `password123`
4. Should redirect to dashboard with logout functionality

---

## ✅ **Current Status: What's Working**

### **🔐 Authentication System (100% Complete)**
- ✅ **Modern Login Flow** with Angular signals + async/await
- ✅ **JWT Token Management** with automatic injection
- ✅ **Route Protection** via signal-based AuthGuard
- ✅ **Session Persistence** with localStorage
- ✅ **Logout Flow** with proper state cleanup
- ✅ **Auto-initialization** on app startup

### **🎨 UI/UX (Complete)**
- ✅ **Professional Login Form** with validation
- ✅ **Dashboard** with user info and logout
- ✅ **Responsive Design** with Tailwind CSS
- ✅ **Modern Angular Components** with signals

### **🔧 Technical Infrastructure (Complete)**
- ✅ **Angular 20** with zoneless change detection
- ✅ **Signal-based state management** (no BehaviorSubject)
- ✅ **Async/await HTTP operations** (no Observable chains)
- ✅ **TypeScript strict mode** compliance
- ✅ **Tailwind CSS 4** with custom theme

---

## 🎯 **Next Development Phase**

### **Priority 1: Core Features**
- [ ] **Account Management** (CRUD with modern patterns)
- [ ] **Transaction Management** (forms + signals)
- [ ] **Budget Planning** (signal-based tracking)
- [ ] **Dashboard Analytics** (charts integration)

### **Priority 2: Advanced Features**
- [ ] **Reporting & Export** functionality
- [ ] **User Preferences** and settings
- [ ] **Performance Optimization** (lazy loading, virtual scrolling)
- [ ] **PWA Features** (offline support)

---

## 📚 **Documentation Structure**

| File | Purpose |
|------|---------|
| `README.md` | 👈 **This file** - Project overview and quick start |
| `DEVELOPMENT-STATUS.md` | 📊 **Current progress** and roadmap |
| `DEVELOPMENT-RULES.md` | 🚨 **MANDATORY** patterns and code rules |
| `STACK.md` | 🛠️ **Technology stack** and architecture decisions |
| `ARCHITECTURE.md` | 🏗️ **System architecture** and diagrams |

**⚠️ READ THESE BEFORE CODING**: The development rules are non-negotiable for maintaining code quality and consistency.

---

## 🔧 **Development Guidelines**

### **For New Features:**
1. **Read** `DEVELOPMENT-RULES.md` first (MANDATORY)
2. **Follow** the service/component patterns exactly
3. **Use** signals for all state management
4. **Use** async/await for all HTTP operations
5. **Test** authentication flow after changes

### **Code Quality Checklist:**
- [ ] Service uses only signals (no BehaviorSubject)
- [ ] HTTP operations use async/await pattern
- [ ] Components use computed signals for UI logic
- [ ] Templates call signals directly with `signal()`
- [ ] No Observable subscriptions in components
- [ ] TypeScript strict mode compliance

---

## 🏗️ **Project Structure**

```
BudgetWise/
├── src/
│   ├── BudgetWise.Frontend/          # Angular 20 app
│   │   ├── src/app/core/            # ✅ Services, guards, interceptors
│   │   ├── src/app/auth/            # ✅ Authentication components
│   │   └── src/app/dashboard/       # ✅ Main dashboard
│   └── BudgetWise.Backend/          # .NET 9 Web API
│       └── BudgetWise.Api/          # ✅ Controllers, services, auth
├── DEVELOPMENT-STATUS.md            # 📊 Current progress
├── DEVELOPMENT-RULES.md             # 🚨 Mandatory patterns
├── STACK.md                         # 🛠️ Technology decisions
└── ARCHITECTURE.md                  # 🏗️ System design
```

---

## 🔍 **Troubleshooting**

### **Common Issues:**
1. **Backend not running**: Start .NET API first
2. **Frontend compilation errors**: Check for legacy Observable patterns
3. **Authentication not working**: Verify backend health endpoint
4. **CORS errors**: Ensure backend allows localhost:4200

### **Development Server Status:**
- **Backend**: https://localhost:7268 (ASP.NET Core)
- **Frontend**: http://localhost:4200 (Angular dev server)
- **Database**: SQL Server (via MCP server integration)

---

## 🤝 **Contributing**

1. **Study** the development rules and patterns
2. **Follow** the modern Angular approach (signals + async/await)
3. **Test** authentication flow with your changes
4. **Ensure** code passes the quality checklist
5. **Update** documentation if adding new features

---

**🎯 Remember**: This project is built with **modern Angular patterns exclusively**. All legacy Observable-based patterns have been migrated to signals.

Il database SQL Server viene creato automaticamente all'avvio dell'applicazione in modalità Development.
Le categorie di default vengono inserite automaticamente.

### Test API

Puoi testare l'API usando gli endpoint già disponibili:

- `POST /api/auth/login` - Login utente (placeholder)
- `POST /api/auth/register` - Registrazione utente (placeholder)
- `GET /api/auth/verify` - Verifica token

## 📁 Struttura del Progetto

```
BudgetWise/
├── src/
│   ├── BudgetWise.Backend/          # Backend .NET 9
│   │   ├── BudgetWise.Api/          # Web API Controllers
│   │   ├── BudgetWise.Core/         # Modelli e Interfacce
│   │   └── BudgetWise.Data/         # Entity Framework Context
│   └── BudgetWise.Frontend/         # Frontend Angular (TODO)
├── tests/
│   └── BudgetWise.Tests/            # Test xUnit
├── docs/                            # Documentazione extra
├── STACK.md                         # Stack tecnologico
├── ARCHITECTURE.md                  # Diagramma architetturale
├── USER-JOURNEY.md                  # Flusso utente
├── BRANDFETCH-INTEGRATION.md        # Integrazione Brandfetch
└── BudgetWise-Whitepaper-v1.5.md   # Visione e roadmap
```

## 🛠️ Stack Tecnologico Implementato

### Backend ✅
- **.NET 9** con Web API
- **Entity Framework Core** + SQL Server
- **JWT Bearer Authentication** 
- **Serilog** per logging
- **Rate Limiting** configurato
- **CORS** per Angular
- **Scalar** per documentazione API (in configurazione)

### Modelli Implementati ✅
- **User** (con ruoli god/demiGod/user)
- **Account** (conti finanziari)
- **Transaction** (transazioni)
- **Category** (categorie con seed data)
- **Budget** (budget e BudgetCategory)
- **BalanceHistory** (storico saldi)
- **Notification** (notifiche)
- **TransactionTag** (tag per transazioni)

### Frontend (TODO)
- **Angular** (ultima versione)
- **Tailwind CSS** + Bootstrap
- **PWA** capabilities

## 🔧 Comandi Utili

### Backend
```bash
# Build
dotnet build

# Run
dotnet run --project src/BudgetWise.Backend/BudgetWise.Api/BudgetWise.Api.csproj

# Test
dotnet test

# Clean
dotnet clean
```

### Database
Il database viene gestito automaticamente tramite Entity Framework.
Per ricrearlo da zero, elimina il database LocalDB e riavvia l'applicazione.

## 📋 Prossimi Passi

1. **Frontend Angular**: Creazione struttura base con routing
2. **Servizi implementazione**: Completare i servizi per CRUD operations
3. **JWT Service**: Implementare la generazione e validazione token
4. **Brandfetch Integration**: Implementare il servizio per l'integrazione
5. **AI Services**: Integrare Google Gemini/Genkit
6. **Tests**: Implementare test unitari e di integrazione

## 🤖 AI Assistant Guidelines

Questo progetto è stato progettato per essere Copilot-friendly:

- Tutti i file di documentazione contengono riferimenti incrociati
- I commenti nel codice referenziano i documenti di specifica
- La struttura segue le best practice definite in `STACK.md`
- I modelli implementano tutte le funzionalità descritte in `USER-JOURNEY.md`

Consulta sempre i documenti di riferimento per generare codice coerente con l'architettura.

---

## 📚 Documentazione & Supporto AI

- **Stack tecnologico**: [`STACK.md`](./STACK.md)
- **Diagramma architetturale**: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **Flusso utente**: [`USER-JOURNEY.md`](./USER-JOURNEY.md)
- **Integrazione Brandfetch**: [`BRANDFETCH-INTEGRATION.md`](./BRANDFETCH-INTEGRATION.md)
- **Visione, roadmap e funzioni chiave**: [`BudgetWise-Whitepaper-v1.5.md`](./BudgetWise-Whitepaper-v1.5.md)

## Policy Database & MCP

Il database di riferimento per BudgetWise è **SQL Server**.  
Tutte le operazioni di **creazione, inizializzazione e discovery del database** possono essere effettuate tramite il server MCP fornito da Copilot.  
AI assistant e Copilot devono utilizzare MCP per gestire provisioning e validazione dello schema dati, seguendo le specifiche di `STACK.md` e `ARCHITECTURE.md`.

---

Tutti gli AI assistant (Copilot compreso) devono fare riferimento a questa documentazione per generare issue, pull request, suggerimenti e codice conforme alle best practice BudgetWise.