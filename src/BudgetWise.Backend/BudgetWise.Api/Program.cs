using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Serilog;
using Scalar.AspNetCore;
using BudgetWise.Data;
using BudgetWise.Data.Models;
using BudgetWise.Core.Interfaces;

// Crea il builder prima per accedere alla configurazione
var builder = WebApplication.CreateBuilder(args);

// Lettura configurazione Serilog da appsettings.json
var seqUrl = builder.Configuration["Seq:ServerUrl"] ?? "http://localhost:5341";
var logFilePath = builder.Configuration["Serilog:FilePath"] ?? "logs/budgetwise-.txt";

// Lettura livelli di logging da configurazione
var defaultLogLevel = Enum.Parse<Serilog.Events.LogEventLevel>(
    builder.Configuration["Serilog:MinimumLevel:Default"] ?? "Information", true);
var microsoftLogLevel = Enum.Parse<Serilog.Events.LogEventLevel>(
    builder.Configuration["Serilog:MinimumLevel:Microsoft"] ?? "Warning", true);
var efLogLevel = Enum.Parse<Serilog.Events.LogEventLevel>(
    builder.Configuration["Serilog:MinimumLevel:Microsoft.EntityFrameworkCore"] ?? "Warning", true);

// Configurazione Serilog con Seq per logging strutturato
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Is(defaultLogLevel)
    .MinimumLevel.Override("Microsoft", microsoftLogLevel)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", efLogLevel)
    .Enrich.FromLogContext()
    .Enrich.WithEnvironmentName()
    .Enrich.WithMachineName()
    .Enrich.WithThreadId()
    .Enrich.WithProperty("Application", "BudgetWise")
    .Enrich.WithProperty("Environment", builder.Environment.EnvironmentName)
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .WriteTo.Seq(seqUrl)
    .WriteTo.File(logFilePath, 
        rollingInterval: RollingInterval.Day,
        outputTemplate: "[{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} {Level:u3}] {Message:lj} {Properties:j}{NewLine}{Exception}")
    .CreateLogger();

Log.Information("Serilog configuration - Seq URL: {SeqUrl}, Log file: {LogFilePath}", seqUrl, logFilePath);
Log.Information("Log levels - Default: {DefaultLevel}, Microsoft: {MicrosoftLevel}, EF: {EFLevel}",
    defaultLogLevel, microsoftLogLevel, efLogLevel);

// Aggiungi Serilog
builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();

// Configurazione Entity Framework con connessione al database MCP SQL Server
// NOTA: La stringa di connessione dovrebbe puntare al server SQL tramite MCP
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Server=localhost;Database=BudgetWise;Trusted_Connection=true;TrustServerCertificate=true;";

builder.Services.AddDbContext<BudgetWiseDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddDbContext<IdentityBudgetWiseDbContext>(options =>
    options.UseSqlServer(connectionString));

// Configurazione ASP.NET Core Identity con CustomUserStore
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    // Configurazione password
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
    
    // Configurazione utente
    options.User.RequireUniqueEmail = true;
    
    // Configurazione signin
    options.SignIn.RequireConfirmedEmail = false;
    options.SignIn.RequireConfirmedPhoneNumber = false;
}).AddEntityFrameworkStores<IdentityBudgetWiseDbContext>()
  .AddDefaultTokenProviders();

// Configurazione JWT Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "BudgetWise_SuperSecretKey_ForDevelopment_ChangeInProduction_2024";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "BudgetWise";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "BudgetWise";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Configurazione CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("BudgetWisePolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configurazione OpenAPI/Swagger con documentazione dettagliata
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Info = new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "BudgetWise API",
            Version = "v1",
            Description = @"
# BudgetWise API - Gestione Intelligente delle Finanze Personali

Questa API fornisce endpoint per la gestione completa delle finanze personali con funzionalità AI integrate.

## Autenticazione
Utilizza JWT Bearer Token per l'autenticazione. Include il token nell'header:
```
Authorization: Bearer {your-jwt-token}
```

## Funzionalità Principali
- **Gestione Utenti**: Registrazione, login, profili
- **Conti Bancari**: CRUD completo per conti e carte
- **Transazioni**: Importazione, categorizzazione automatica, analisi
- **Budget**: Creazione e monitoraggio budget intelligenti
- **Analytics**: Statistiche e insights con AI
- **Brand Recognition**: Riconoscimento automatico merchant tramite Brandfetch

## Rate Limiting
Le API sono protette da rate limiting per prevenire abusi.

## Logging
Tutte le operazioni sono tracciate tramite Serilog con structured logging.
            ",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "BudgetWise Team",
                Email = "support@budgetwise.it"
            },
            License = new Microsoft.OpenApi.Models.OpenApiLicense
            {
                Name = "MIT License",
                Url = new Uri("https://opensource.org/licenses/MIT")
            }
        };

        // Configurazione server
        document.Servers = new List<Microsoft.OpenApi.Models.OpenApiServer>
        {
            new() {
                Url = "https://localhost:7268",
                Description = "Development HTTPS"
            },
            new() {
                Url = "http://localhost:5194",
                Description = "Development HTTP"
            }
        };

        // Tag per organizzazione endpoint
        document.Tags = new List<Microsoft.OpenApi.Models.OpenApiTag>
        {
            new() {
                Name = "Authentication",
                Description = "Endpoint per autenticazione e gestione utenti"
            },
            new() {
                Name = "Accounts",
                Description = "Gestione conti bancari e carte di credito"
            },
            new() {
                Name = "Transactions",
                Description = "Operazioni su transazioni e movimenti"
            },
            new() {
                Name = "Budgets",
                Description = "Creazione e gestione budget"
            },
            new() {
                Name = "Analytics",
                Description = "Statistiche e analisi con AI"
            },
            new() {
                Name = "System",
                Description = "Endpoint di sistema e health check"
            }
        };

        return Task.CompletedTask;
    });
});

// Repository Pattern: Register repositories and services
builder.Services.AddScoped<BudgetWise.Data.Interfaces.IAccountRepository, BudgetWise.Data.Repositories.AccountRepository>();
builder.Services.AddScoped<BudgetWise.Core.Interfaces.IAccountService, BudgetWise.Core.Services.AccountService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
// Abilita OpenAPI e Scalar sempre per development (anche in Production per debug)
app.MapOpenApi();

// Configurazione Scalar per documentazione API interattiva
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("BudgetWise API Documentation")
        .WithTheme(ScalarTheme.Purple)
        .WithDefaultHttpClient(ScalarTarget.CSharp, ScalarClient.HttpClient)
        .WithSearchHotKey("k");
});

// Middleware pipeline
app.UseSerilogRequestLogging();
app.UseHttpsRedirection();
app.UseCors("BudgetWisePolicy");
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => new { Status = "Healthy", Timestamp = DateTime.UtcNow, Version = "1.0.0" })
    .WithName("HealthCheck")
    .WithTags("System");

Log.Information("BudgetWise API starting up...");
Log.Information("Environment: {Environment}", app.Environment.EnvironmentName);

try
{
    Log.Information("Starting web host on {Urls}", string.Join(", ", builder.Configuration.GetSection("applicationUrl").Get<string[]>() ?? new[] { "https://localhost:7268", "http://localhost:5194" }));
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application startup failed");
}
finally
{
    Log.CloseAndFlush();
}
