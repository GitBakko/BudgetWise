# Guida all'Integrazione con le API di Brandfetch

Questo documento descrive in dettaglio l'interazione tra BudgetWise e i servizi esterni forniti da **Brandfetch.com** per la ricerca e il recupero di loghi e informazioni sui brand.

---

## 1. Panoramica del Servizio

Brandfetch viene utilizzato in due fasi distinte per fornire un'esperienza utente fluida durante la creazione di conti o la gestione dei brand nel pannello di amministrazione:

1. **Ricerca Pubblica (Senza Autenticazione)**: Per ottenere una lista rapida di suggerimenti di brand basata su un nome.
2. **Recupero Dettagli (Con Autenticazione)**: Per ottenere informazioni complete, inclusi loghi di alta qualità e colori, per un brand specifico selezionato.

Questa integrazione è gestita principalmente dal file `src/services/logo-finder.ts`.

---

## 2. API Key e Credenziali

L'integrazione richiede una chiave API per poter accedere all'endpoint di recupero dettagli.

- **Servizio**: Brandfetch.com
- **Account**: È necessario creare un account gratuito (o a pagamento) su [https://brandfetch.com](https://brandfetch.com).
- **API Key**: Dopo aver creato l'account, la chiave API può essere generata nella dashboard del proprio profilo.

### Configurazione in BudgetWise

La chiave API deve essere inserita nel file `.env` alla radice del progetto, utilizzando la seguente variabile d'ambiente:

```env
BRANDFETCH_API_KEY="6YIbfhd+M+AVu3UkGfJGh5ze+pKgMp6Wyl0xvWB4rXE="
```

---

## 3. Flusso di Interazione

### Fase 1: Ricerca Brand (Search)

- **Trigger**: L'utente digita il nome di un conto nel form di creazione (`AddAccountDialog` o `CreateBrandDialog`).
- **Funzione Coinvolta**: `searchBrands(companyName: string)` in `src/services/logo-finder.ts`.
- **Endpoint API**: `GET https://api.brandfetch.io/v2/search/:companyName`
- **Autenticazione**: **Nessuna**. Questo è un endpoint pubblico.
- **Logica**:
    1. La funzione prende il nome inserito dall'utente.
    2. Effettua una chiamata `fetch` all'endpoint pubblico di Brandfetch.
    3. Riceve un array di possibili brand corrispondenti.
    4. Filtra i risultati per escludere i loghi in formato SVG (per compatibilità) e rimuovere eventuali duplicati visivi.
    5. Restituisce un array di `BrandSuggestion`, che viene mostrato all'utente come una lista di loghi cliccabili.

### Fase 2: Recupero Dettagli Brand (Get Details)

- **Trigger**: L'utente clicca su uno dei loghi suggeriti dalla Fase 1.
- **Funzione Coinvolta**: `getBrandDetails(brandId: string)` in `src/services/logo-finder.ts`.
- **Endpoint API**: `GET https://api.brandfetch.io/v2/brands/:brandId`
- **Autenticazione**: **Bearer Token**. La funzione legge la chiave da `BRANDFETCH_API_KEY` e la inserisce nell'header `Authorization`.
- **Logica**:
    1. La funzione riceve l'ID univoco del brand selezionato.
    2. Effettua una chiamata `fetch` all'endpoint autenticato di Brandfetch.
    3. Riceve un oggetto JSON (`BrandDetails`) contenente tutte le informazioni sul brand (loghi in vari formati, colori, link, etc.).
    4. Il `getBrandDetailsFlow` in `src/ai/flows/getBrandDetailsFlow.ts` elabora questa risposta:
        - Seleziona il logo di qualità migliore (non SVG).
        - Scarica l'immagine e la converte in un `dataURI` (Base64).
        - Estrae il colore primario del brand.
    5. Questi dati (dataURI, colore, nome) vengono usati per pre-compilare i campi del form, fornendo un'esperienza utente rapida e automatizzata.

Questo flusso in due passaggi garantisce un utilizzo efficiente delle API, sfruttando l'endpoint pubblico non autenticato per la ricerca iniziale e utilizzando la chiamata autenticata (che potrebbe avere limiti di utilizzo) solo quando strettamente necessario.

---

## 4. Note di Sicurezza e Best Practice

- **Limiti di utilizzo**: L'endpoint autenticato può avere rate limit; usarlo solo quando necessario.
- **Gestione errori**: Implementare logica di fallback e messaggi chiari all’utente in caso di errori o limiti API.

---

## 5. Riferimenti

- [Brandfetch API Docs](https://docs.brandfetch.com/)
- [Src: logo-finder.ts](./logo-finder.ts)
- [Src: getBrandDetailsFlow.ts](./getBrandDetailsFlow.ts)
