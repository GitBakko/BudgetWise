# BudgetWise - Avvio e Test del Progetto

## 🚀 Quick Start

### Prerequisiti
- .NET 9 SDK
- Node.js 18+
- SQL Server
- Visual Studio Code con estensioni C# e Angular

### Avvio del Progetto

#### 1. Backend (.NET)
Usa i task predefiniti in VSCode:

- **Build Backend**: `Ctrl+Shift+P` → "Tasks: Run Task" → "BudgetWise: Build Backend"
- **Run Backend (HTTPS)**: `Ctrl+Shift+P` → "Tasks: Run Task" → "BudgetWise: Run Backend (HTTPS)"
- **Run Backend (HTTP)**: `Ctrl+Shift+P` → "Tasks: Run Task" → "BudgetWise: Run Backend (HTTP)"

Il backend sarà disponibile su:
- HTTPS: https://localhost:7268
- HTTP: http://localhost:5194
- Documentazione API: https://localhost:7268/scalar/v1

#### 2. Frontend (Angular)
- **Run Frontend**: `Ctrl+Shift+P` → "Tasks: Run Task" → "BudgetWise: Run Frontend (Angular)"

Il frontend sarà disponibile su:
- http://localhost:4200

### 🧪 Test delle API

#### Metodo 1: File HTTP
Apri il file `BudgetWise-API-Tests.http` e usa l'estensione "REST Client" di VSCode per testare le API.

#### Metodo 2: Documentazione Interattiva
Vai su https://localhost:7268/scalar/v1 per la documentazione interattiva con Scalar.

#### Metodo 3: Task di Test
Usa il task predefinito: `Ctrl+Shift+P` → "Tasks: Run Task" → "BudgetWise: Test Brand Search API"

### 🏗️ Architettura delle API Brand

#### Endpoint Principali

1. **Ricerca Brand**: `GET /api/brands/search?query={query}`
   - Cerca prima nel database locale
   - Fallback su Brandfetch API se non trova risultati

2. **Dettagli Brand**: `POST /api/brands/details`
   - Ottiene dettagli completi da Brandfetch
   - Scarica logo e converte in DataURI
   - Estrae colori automaticamente
   - Salva nel database locale per caching

3. **Generazione Icone**: `POST /api/icons/generate`
   - Genera icone placeholder SVG con iniziali
   - Colori automatici basati su hash del nome
   - Preparato per integrazione AI futura

4. **Salvataggio Brand**: `POST /api/brands/save`
   - Salva brand personalizzati nel database locale

#### Struttura Database

```sql
CREATE TABLE [SmartBrands] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(100) NOT NULL,
    [NameLowercase] nvarchar(100) NOT NULL,
    [Domain] nvarchar(200) NULL,
    [ExternalId] nvarchar(100) NULL,
    [Website] nvarchar(500) NULL,
    [LogoUrl] nvarchar(max) NULL,
    [PrimaryColor] nvarchar(50) NULL,
    [Description] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetimeoffset NOT NULL,
    [UpdatedAt] datetimeoffset NULL,
    [CreatedByUid] nvarchar(100) NULL,
    [CreatedByDisplayName] nvarchar(100) NULL,
    [Metadata] nvarchar(max) NULL,
    CONSTRAINT [PK_SmartBrands] PRIMARY KEY ([Id])
);
```

### 🔧 Debugging

#### Backend
1. Usa la configurazione di launch "Launch BudgetWise Backend" in VSCode
2. Oppure usa "Attach to BudgetWise Backend" per attach a un processo esistente

#### Frontend
1. Apri il browser DevTools
2. Oppure usa l'estensione Angular DevTools

### 📋 Configurazioni Importanti

#### appsettings.json
```json
{
  "Brandfetch": {
    "ApiKey": "YOUR_API_KEY",
    "BaseUrl": "https://api.brandfetch.io/v2"
  },
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_SQL_SERVER_CONNECTION"
  }
}
```

#### Frontend Proxy (proxy.conf.json)
```json
{
  "/api/*": {
    "target": "https://localhost:7268",
    "secure": true,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### 🎯 Funzionalità Implementate

✅ **Backend Completo**
- Integrazione Brandfetch API
- Repository pattern con Entity Framework
- Debouncing per ricerche
- Auto-caching brand da Brandfetch
- Generazione icone placeholder SVG
- Logging strutturato con Serilog
- Documentazione API con Scalar

✅ **Frontend Base**
- Service per gestione brand con debouncing RxJS
- Component per creazione account con ricerca intelligente
- Integrazione PrimeNG per UI avanzata
- Signal-based reactive architecture

### 🚧 Prossimi Passi

1. **Completare Frontend**: Integrare il nuovo IconService con l'AccountComponent
2. **File Upload**: Implementare storage per icone personalizzate
3. **AI Integration**: Integrare servizio AI per generazione icone reali
4. **Testing**: Aggiungere unit test e integration test
5. **Production**: Configurazione per environment di produzione

---

**Nota**: Tutti i task sono preconfigurati in `.vscode/tasks.json` per un'esperienza di sviluppo ottimale! 🎉
