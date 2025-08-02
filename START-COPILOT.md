# Prompt per Copilot: Avvio sviluppo BudgetWise

BudgetWise è una PWA per la gestione intelligente delle finanze personali.  
La documentazione tecnica e funzionale è già pronta nella root del repository.  
Utilizza esclusivamente questi file come riferimento per generare codice, issue, PR e suggerimenti:

- `STACK.md`: stack tecnologico, versioni e convenzioni.
- `ARCHITECTURE.md`: diagramma architetturale, flussi dati e relazioni tra componenti.
- `BRANDFETCH-INTEGRATION.md`: integrazione con Brandfetch API, gestione credenziali e flussi.
- `USER-JOURNEY.md`: flussi di navigazione e mappa esperienza utente.
- `BudgetWise-Whitepaper-v1.5.md`: visione strategica, funzioni chiave, roadmap.
- README.md: mappa dei file e riferimenti incrociati.

## Obiettivo

Avvia lo sviluppo della base del progetto, seguendo queste linee guida:

1. **Crea la struttura iniziale del progetto**, separando chiaramente frontend, backend, servizi AI e documentazione.
2. **Implementa le funzionalità minime** descritte in `USER-JOURNEY.md` e `Whitepaper`, partendo dall'onboarding e dashboard utente.
3. **Configura lo stack** secondo quanto indicato in `STACK.md`.
4. **Prepara file di esempio** per l'integrazione Brandfetch e le chiamate API.
5. **Commenta il codice** facendo riferimento ai documenti tecnici.
6. **Genera issue e PR** solo se coerenti con la documentazione allegata.

## Database

Il database di riferimento per BudgetWise è **SQL Server** (come dichiarato in `STACK.md`).  
Le operazioni di creazione, inizializzazione e discovery del database possono essere effettuate tramite il server MCP fornito da Copilot.  
Utilizza MCP per generare, inizializzare e validare lo schema dati secondo le specifiche presenti in `ARCHITECTURE.md` e `STACK.md`.

**Tieni conto di tutte le convenzioni e best practice descritte nei file allegati.  
Non inventare funzionalità non documentate.  
Motiva ogni scelta tecnica con riferimenti ai documenti del repository.**

---