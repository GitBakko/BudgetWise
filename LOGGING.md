# BudgetWise - Logging Infrastructure ✅ COMPLETATO

## Panoramica
BudgetWise utilizza **Serilog** per il logging strutturato con integrazione **Seq** per l'analisi e visualizzazione dei log in tempo reale.

## Status: ✅ FUNZIONANTE
- [x] Container Seq configurato e operativo
- [x] Serilog integrato con multi-sink (Console, File, Seq)
- [x] Configurazione parametrizzata tramite appsettings
- [x] Enrichment strutturato con metadati
- [x] Test di connettività verificati e funzionanti
- [x] Logging delle richieste HTTP attivo
- [x] Autenticazione Seq configurata

## Configurazione

### appsettings.json (Produzione)
```json
{
  "Seq": {
    "ServerUrl": "http://localhost:5341"
  },
  "Serilog": {
    "FilePath": "logs/budgetwise-.txt",
    "MinimumLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```

### appsettings.Development.json (Sviluppo)
```json
{
  "Seq": {
    "ServerUrl": "http://localhost:5341"
  },
  "Serilog": {
    "FilePath": "logs/budgetwise-dev-.txt",
    "MinimumLevel": {
      "Default": "Debug",
      "Microsoft": "Warning",
      "Microsoft.EntityFrameworkCore": "Information"
    }
  }
}
```

## Configurazione Seq con Docker

### docker-compose.logging.yml
```yaml
services:
  seq:
    image: datalust/seq:latest
    container_name: budgetwise-seq
    environment:
      - ACCEPT_EULA=Y
      - SEQ_FIRSTRUN_ADMINPASSWORD=Admin123!
    ports:
      - "5341"
    volumes:
      - seq-data:/data
    restart: unless-stopped
    networks:
      - budgetwise-network

volumes:
  seq-data:

networks:
  budgetwise-network:
    driver: bridge
```

### Avvio Seq
```powershell
# Avvia Seq
docker compose -f docker-compose.logging.yml up -d

# Verifica stato
docker ps

# Ottieni porta mappata
docker port budgetwise-seq
```

## Accesso a Seq

- **URL**: http://localhost:[porta-mappata] (es. http://localhost:54502)
- **Username**: admin
- **Password**: Admin123!

## Livelli di Logging

| Livello | Descrizione | Quando usare |
|---------|-------------|--------------|
| `Debug` | Informazioni dettagliate per debug | Solo in Development |
| `Information` | Flusso generale dell'applicazione | Default in produzione |
| `Warning` | Situazioni anomale ma gestibili | Sempre |
| `Error` | Errori che non fermano l'applicazione | Sempre |
| `Fatal` | Errori che fermano l'applicazione | Sempre |

## Struttura dei Log

Ogni log include automaticamente:
- **Timestamp**: Data e ora precisa
- **Level**: Livello del log
- **Message**: Messaggio principale
- **Properties**: Proprietà strutturate
  - `Application`: "BudgetWise"
  - `Environment`: "Development" / "Production"
  - `MachineName`: Nome del server
  - `ThreadId`: ID del thread

## Esempio di Utilizzo

```csharp
// Log semplice
_logger.LogInformation("Operazione completata");

// Log strutturato con parametri
_logger.LogInformation("Login successful for {Email} with UserId {UserId}", 
    request.Email, user.Id);

// Log con scope per operazioni correlate
using var scope = _logger.BeginScope(new Dictionary<string, object>
{
    ["Operation"] = "UserLogin",
    ["Email"] = request.Email
});
```

## Benefici

1. **Searchability**: Log strutturati facilmente ricercabili in Seq
2. **Correlation**: Tracking di operazioni correlate tramite scope
3. **Performance**: Filtraggio efficiente per livello e categoria
4. **Observability**: Dashboard e alerting integrati in Seq
5. **Flexibility**: Configurazione dinamica senza ricompilazione

## Troubleshooting

### Seq non si avvia
- Verificare che Docker Desktop sia in esecuzione
- Controllare i log del container: `docker logs budgetwise-seq`
- Verificare che la porta non sia già in uso

### Log non appaiono in Seq
- Verificare la configurazione `Seq:ServerUrl` in appsettings
- Controllare che Seq sia raggiungibile dall'applicazione
- Verificare i livelli di logging

### Performance
- In produzione usare livello `Information` o superiore
- Considerare l'uso di `ApiKey` per l'autenticazione Seq
- Configurare retention policy per i log file
