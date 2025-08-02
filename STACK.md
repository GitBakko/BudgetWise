# BudgetWise – Modern Technology Stack

**UPDATED**: August 1, 2025 - **Authentication System Complete**

This document describes the **MODERN** technology stack used for BudgetWise development. 

## 🚨 **CRITICAL: Development Philosophy**

**ALL FUTURE DEVELOPMENT MUST FOLLOW THESE PATTERNS:**
- **Frontend**: Angular 20 with **100% Signals** (NO BehaviorSubject/Observable for state)
- **HTTP**: **Async/Await + Promises** (NO Observable chains)
- **State Management**: **Angular Signals ONLY**
- **Backend**: .NET 9 Web API with JWT authentication

---

## 🎯 **Frontend Stack (CURRENT)**

### **Core Framework**
- **Angular**: v20+ with **Zoneless Change Detection**
- **TypeScript**: Latest version with strict mode
- **Package Manager**: npm
- **Build Tool**: Angular CLI + Vite

### **🚀 MANDATORY: State Management Pattern**
```typescript
// ✅ CORRECT: Signals for all state management
private dataSignal = signal<Data[]>([]);
public readonly data = this.dataSignal.asReadonly();
public readonly computed = computed(() => this.data().length);

// ❌ FORBIDDEN: BehaviorSubject/Observable for state
// private dataSubject = new BehaviorSubject<Data[]>([]);
```

### **🚀 MANDATORY: HTTP Pattern**
```typescript
// ✅ CORRECT: Async/await for all HTTP operations
async loadData(): Promise<Data[]> {
  const response = await lastValueFrom(
    this.http.get<Data[]>('/api/data')
  );
  this.dataSignal.set(response);
  return response;
}

// ❌ FORBIDDEN: Observable chains
// return this.http.get().pipe(tap(), map());
```

### **UI & Styling**
- **CSS Framework**: Tailwind CSS v4
- **Component Style**: Angular Standalone Components
- **Icons**: Heroicons (SVG)
- **Design System**: Custom BudgetWise theme (green primary)

### **Development Tools**
- **Linting**: ESLint + Prettier
- **IDE**: VS Code with Angular Language Service
- **Testing**: Jasmine + Karma (when needed)

---

## 🎯 **Backend Stack (CURRENT)**

### **Core Framework**
- **Framework**: .NET 9 Web API
- **Language**: C# 12
- **Architecture**: Clean Architecture with Controllers/Services separation

### **Database & ORM**
- **Database**: SQL Server 2019+
- **ORM**: Entity Framework Core (latest)
- **Migrations**: Code-First approach
- **Connection**: Integrated with MCP server for development

### **Authentication & Security**
- **Authentication**: JWT Bearer Tokens
- **Authorization**: Role-based + Claims
- **CORS**: Configured for localhost development
- **Rate Limiting**: Built-in .NET middleware

### **API & Documentation**
- **API Style**: RESTful endpoints
- **Documentation**: Swagger/OpenAPI with Scalar UI
- **Response Format**: Standardized DTOs
- **Error Handling**: Global exception middleware

### **Logging & Monitoring**
- **Logging**: Serilog with structured logging
- **Log Sinks**: Console + File + Seq (development)
- **Monitoring**: OpenTelemetry (.NET SDK)
- **Health Checks**: Built-in health check endpoints

---

## 🎯 **Development Infrastructure**

### **Currently Running Services**
- **Frontend**: http://localhost:4200 (Angular dev server)
- **Backend**: https://localhost:7268 (ASP.NET Core)
- **Database**: SQL Server (via MCP server integration)

### **Development Workflow**
1. **Backend**: Start .NET API → Verify health endpoint
2. **Database**: Ensure MCP server connection active
3. **Frontend**: Start Angular dev server → Test authentication flow

### **Configuration Management**
- **Frontend**: Environment-based configuration
- **Backend**: appsettings.json with environment overrides
- **Secrets**: Local development with user secrets

---

## ✅ **Implemented Features Status**

### **Authentication System** ✅ **COMPLETE**
- **Login Flow**: Modern Angular signals + async/await
- **Token Management**: JWT with localStorage persistence
- **Route Protection**: Signal-based AuthGuard
- **Session Management**: Auto-initialization on app startup
- **Logout Flow**: Complete with state cleanup

### **Core Infrastructure** ✅ **COMPLETE**
- **HTTP Interceptors**: Automatic JWT token injection
- **Error Handling**: User-friendly error messages
- **Loading States**: Signal-based loading indicators
- **Responsive UI**: Tailwind CSS responsive design

---

## 🎯 **Next Development Phase**

### **Priority 1: Core Business Features**
- **Account Management**: CRUD operations with signals
- **Transaction Management**: Modern forms with validation
- **Budget Planning**: Signal-based budget tracking
- **Dashboard Analytics**: Chart integration with signals

### **Priority 2: Advanced Features**
- **Reporting**: PDF/Excel export functionality
- **User Preferences**: Dark mode, settings management
- **Performance**: Lazy loading, virtual scrolling
- **PWA**: Offline support, app installation

---

## 🚫 **DEPRECATED/FORBIDDEN Technologies**

### **Frontend - NEVER USE:**
- ❌ **BehaviorSubject** for state management
- ❌ **Observable chains** with .pipe() for data flow
- ❌ **Angular Material** (use Tailwind components)
- ❌ **NgRx** (use Angular signals instead)
- ❌ **RxJS operators** for state (use signals)

### **Backend - AVOID:**
- ❌ **Entity Framework** without proper async patterns
- ❌ **Synchronous HTTP calls** from frontend
- ❌ **Session-based authentication** (use JWT only)

---

## 📋 **Quality Standards**

### **Code Quality Checklist**
- [ ] All services use signals for state management
- [ ] All HTTP operations use async/await pattern
- [ ] Components use computed signals for derived state
- [ ] Templates call signals directly with `signal()`
- [ ] No BehaviorSubject or Observable chains for state
- [ ] TypeScript strict mode compliance
- [ ] Responsive design with Tailwind CSS

### **Testing Strategy**
- **Unit Tests**: Component logic and service methods
- **Integration Tests**: API endpoints and authentication
- **E2E Tests**: Critical user flows (login, logout, transactions)

---

## 🔧 **Development Environment Setup**

### **Prerequisites**
- Node.js v18+
- .NET 9 SDK
- SQL Server (or MCP server access)
- VS Code with Angular extensions

### **Quick Start**
```bash
# Frontend
cd BudgetWise/src/BudgetWise.Frontend
npm install
ng serve

# Backend
cd BudgetWise/src/BudgetWise.Backend
dotnet restore
dotnet run
```

---

**📝 Note**: This stack document reflects the CURRENT WORKING STATE as of August 2025. All future development MUST follow the modern patterns established in the authentication system.

- **CI/CD:** Azure DevOps (pipeline automatizzate per build, test e deploy)
- **Code Quality:** Linting, test automatici e code review

---

## Sistemi di Notifica

- **Email:** SMTP server integrato
- **FUTURE:** SMS/WhatsApp (valutazione in roadmap)

---

## Documentazione

- **Backend:** Scalar + OpenAPI/Swagger
- **Frontend:** Storybook per documentazione e visualizzazione componenti UI

---

## Integrazioni Esterne

- **AI:** Google Gemini, Genkit
- **API:** Previste integrazioni con Open Banking, Plaid, altri partner

---

## Performance

- **Backend:** Caching tramite MemoryCache .NET, Redis (open source), ottimizzazione query, lazy evaluation dove possibile
- **Frontend:** Lazy loading moduli Angular, ottimizzazione bundle e assets

---

## Futuri Aggiornamenti

Questo file sarà aggiornato con nuove tecnologie, versioni e convenzioni man mano che il progetto evolve.

---

**Ultimo aggiornamento:** 2025-08-01
