import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

export interface BrandSuggestion {
  id: string;
  name: string;
  logoUrl: string;
  color?: string;
  source: 'local' | 'brandfetch';
}

export interface IconGenerationResult {
  dataUri: string;
  color: string;
}

/**
 * Servizio per la gestione intelligente di icone e colori dei conti
 * Implementa ricerca locale, Brandfetch e generazione AI
 * 
 * ✅ FOLLOWS: DEVELOPMENT-RULES.md patterns
 * ✅ USES: ConfigService for API endpoints
 * ✅ USES: Angular Signals for state management
 * ✅ USES: async/await for HTTP operations
 */
@Injectable({
  providedIn: 'root'
})
export class IconService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  
  // ✅ RULE: Angular Signals for ALL state management
  public readonly isLoadingBrands = signal<boolean>(false);
  public readonly isGeneratingIcon = signal<boolean>(false);
  public readonly brandSuggestions = signal<BrandSuggestion[]>([]);
  
  // ✅ RULE: Debounce implementation with signals and timeout (no RxJS)
  private debounceTimer: any = null;
  private readonly DEBOUNCE_TIME = 500;

  /**
   * ✅ RULE: Private method to build API URLs using ConfigService
   */
  private getBrandsApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/brands`;
  }

  private getIconsApiUrl(): string {
    return `${this.configService.getApiUrl()}/api/icons`;
  }

  /**
   * Cerca suggerimenti di loghi basati sul nome del conto
   * Implementa ricerca locale + Brandfetch come descritto nella guida
   * Mantiene compatibilità per ricerche immediate
   */
  async searchBrandLogos(accountName: string): Promise<BrandSuggestion[]> {
    if (!accountName || accountName.length < 2) {
      this.brandSuggestions.set([]);
      return [];
    }

    // Per compatibilità, esegue ricerca immediata
    return await this.performBrandSearch(accountName);
  }

  /**
   * Cerca brand nel database locale (Brand Hub)
   */
  private async searchLocalBrands(name: string): Promise<BrandSuggestion[]> {
    try {
      const response = await lastValueFrom(
        this.http.get<BrandSuggestion[]>(`${this.getBrandsApiUrl()}/search?name=${encodeURIComponent(name)}`)
      );
      
      return response.map(brand => ({
        ...brand,
        source: 'local' as const
      }));
    } catch (error) {
      console.warn('Ricerca locale brand fallita:', error);
      return [];
    }
  }

  /**
   * Cerca brand su Brandfetch API
   */
  private async searchBrandfetch(name: string): Promise<BrandSuggestion[]> {
    try {
      const response = await lastValueFrom(
        this.http.get<BrandSuggestion[]>(`${this.getBrandsApiUrl()}/brandfetch/search?name=${encodeURIComponent(name)}`)
      );
      
      return response.map(brand => ({
        ...brand,
        source: 'brandfetch' as const
      }));
    } catch (error) {
      console.warn('Ricerca Brandfetch fallita:', error);
      return [];
    }
  }

  /**
   * Ottiene dettagli completi di un brand da Brandfetch con fallback intelligente
   * Implementa il getBrandDetailsFlow della guida
   */
  async getBrandDetails(brandId: string): Promise<IconGenerationResult | null> {
    this.isGeneratingIcon.set(true);
    
    try {
      const response = await lastValueFrom(
        this.http.post<IconGenerationResult>(`${this.getBrandsApiUrl()}/brandfetch/details`, {
          brandId
        })
      );
      
      return response;
    } catch (error) {
      console.warn('Errore nel recupero dettagli brand da Brandfetch, uso generazione AI:', error);
      
      // ✅ FALLBACK: Se Brandfetch fallisce, genera un'icona AI con il nome del brand
      const brandName = brandId.replace('.com', '').replace('.', ' ');
      return await this.generateAccountIcon(brandName, 'modern');
    } finally {
      this.isGeneratingIcon.set(false);
    }
  }

  /**
   * Genera un'icona con AI basata sul nome del conto
   */
  async generateAccountIcon(accountName: string, style: 'modern' | 'minimal' | 'colorful' = 'modern'): Promise<IconGenerationResult | null> {
    if (!accountName || accountName.length < 2) {
      return null;
    }

    this.isGeneratingIcon.set(true);
    
    try {
      const response = await lastValueFrom(
        this.http.post<IconGenerationResult>(`${this.getIconsApiUrl()}/generate`, {
          name: accountName,
          style: style,
          size: 256
        })
      );
      
      return response;
    } catch (error) {
      console.error('Errore nella generazione icona AI:', error);
      return null;
    } finally {
      this.isGeneratingIcon.set(false);
    }
  }

  /**
   * ✅ NEW: Processalogo esterno tramite proxy backend
   * Converte URL esterni in DataURI sicuri tramite il backend
   */
  async processExternalLogo(logoUrl: string): Promise<IconGenerationResult | null> {
    this.isGeneratingIcon.set(true);
    
    try {
      const response = await lastValueFrom(
        this.http.post<IconGenerationResult>(`${this.getBrandsApiUrl()}/process-external-logo`, {
          logoUrl
        })
      );
      
      return response;
    } catch (error) {
      console.warn('Errore nel processing logo esterno, genero fallback:', error);
      
      // Fallback: genera un'icona placeholder
      return {
        dataUri: this.generatePlaceholderDataUri('?', '#0066CC'),
        color: '#0066CC'
      };
    } finally {
      this.isGeneratingIcon.set(false);
    }
  }

  /**
   * ✅ NEW: Genera un dataURI placeholder SVG
   */
  private generatePlaceholderDataUri(text: string, color: string): string {
    const svg = `
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect width="64" height="64" fill="${color}" rx="8"/>
        <text x="32" y="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
          ${text}
        </text>
      </svg>
    `.trim();
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Converte un file immagine in dataURI
   */
  async fileToDataUri(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      
      reader.onerror = (e) => {
        reject(new Error('Errore nella lettura del file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Genera colori suggeriti basati sul nome del conto
   */
  generateSuggestedColors(accountName: string): string[] {
    const colorMap: Record<string, string[]> = {
      // Banche principali
      'unicredit': ['#E31B23', '#FF4444'],
      'intesa': ['#0066CC', '#4A90E2'],
      'bpm': ['#1E4A5C', '#2E5A7C'],
      'bnl': ['#00A652', '#00CC66'],
      'poste': ['#FFD700', '#FFA500'],
      
      // Carte di credito
      'visa': ['#1A1F71', '#3A47D5'],
      'mastercard': ['#FF5F00', '#EB001B'],
      'american express': ['#006FCF', '#0077BE'],
      
      // Tipi di conto
      'corrente': ['#0066CC', '#4A90E2', '#00CC66'],
      'risparmio': ['#00CC66', '#28A745', '#20C997'],
      'investimenti': ['#6610F2', '#E83E8C', '#FD7E14'],
      'credito': ['#DC3545', '#FF6B6B', '#FF8E8E'],
      'contanti': ['#28A745', '#20C997', '#6F42C1'],
    };

    const lowerName = accountName.toLowerCase();
    
    // Cerca match esatti
    for (const [key, colors] of Object.entries(colorMap)) {
      if (lowerName.includes(key)) {
        return colors;
      }
    }
    
    // Colori di default basati sul primo carattere
    const defaultColors = [
      '#0066CC', '#28A745', '#DC3545', '#6610F2', 
      '#FD7E14', '#20C997', '#E83E8C', '#6C757D'
    ];
    
    const index = accountName.charCodeAt(0) % defaultColors.length;
    return [defaultColors[index], ...defaultColors.filter((_, i) => i !== index).slice(0, 2)];
  }

  /**
   * ✅ RULE: Debounced search using signals and native setTimeout (NO RxJS)
   * Modern Angular approach with async/await
   */
  searchBrandLogosDebounced(accountName: string): void {
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Clear results if search term is too short
    if (!accountName || accountName.length < 2) {
      this.brandSuggestions.set([]);
      return;
    }

    // Set new timer
    this.debounceTimer = setTimeout(async () => {
      try {
        const results = await this.performBrandSearch(accountName);
        this.brandSuggestions.set(results);
      } catch (error) {
        console.error('Errore nella ricerca brand con debounce:', error);
        this.brandSuggestions.set([]);
      }
    }, this.DEBOUNCE_TIME);
  }

  /**
   * ✅ RULE: Private async method for brand search orchestration
   * Processa automaticamente gli URL esterni in DataURI sicuri
   */
  private async performBrandSearch(accountName: string): Promise<BrandSuggestion[]> {
    this.isLoadingBrands.set(true);
    
    try {
      // Prima ricerca locale nel Brand Hub
      const localResults = await this.searchLocalBrands(accountName);
      
      // Controlla se i risultati locali hanno loghi fallback
      const hasValidLocalLogos = localResults.some(brand => 
        brand.logoUrl && 
        !brand.logoUrl.includes('text>?</text>') && // Non è il fallback SVG con "?"
        !brand.logoUrl.includes('via.placeholder.com') // Non è un placeholder esterno
      );
      
      // Se non trova risultati locali O i loghi locali sono fallback, cerca su Brandfetch
      let externalResults: BrandSuggestion[] = [];
      if (localResults.length === 0 || !hasValidLocalLogos) {
        const brandfetchResults = await this.searchBrandfetch(accountName);
        
        // ✅ NEW: Processa automaticamente gli URL esterni in DataURI sicuri
        for (const brand of brandfetchResults) {
          if (brand.logoUrl && brand.logoUrl.startsWith('http')) {
            try {
              const processedLogo = await this.processExternalLogo(brand.logoUrl);
              if (processedLogo) {
                brand.logoUrl = processedLogo.dataUri;
                brand.color = processedLogo.color;
              } else {
                // Fallback: genera placeholder SVG locale
                brand.logoUrl = this.generatePlaceholderDataUri(brand.name.charAt(0).toUpperCase(), '#0066CC');
              }
            } catch (error) {
              console.warn('Errore processing logo per', brand.name, error);
              brand.logoUrl = this.generatePlaceholderDataUri(brand.name.charAt(0).toUpperCase(), '#0066CC');
            }
          }
        }
        externalResults = brandfetchResults;
      }
      
      // Se abbiamo risultati esterni validi, preferiscili a quelli locali con fallback
      if (externalResults.length > 0 && !hasValidLocalLogos) {
        return externalResults;
      }
      
      return [...localResults, ...externalResults];
    } catch (error) {
      console.error('Errore nella ricerca brand:', error);
      return [];
    } finally {
      this.isLoadingBrands.set(false);
    }
  }

  /**
   * ✅ NEW: Assicura che un URL logo sia sicuro (DataURI o fallback)
   */
  ensureSafeLogo(logoUrl: string | undefined, brandName: string): string {
    if (!logoUrl) {
      return this.generatePlaceholderDataUri(brandName.charAt(0).toUpperCase(), '#0066CC');
    }
    
    if (logoUrl.startsWith('data:')) {
      return logoUrl; // Già un DataURI sicuro
    }
    
    if (logoUrl.startsWith('http')) {
      // URL esterno pericoloso, genera placeholder immediato
      console.warn('URL esterno rilevato nel template, uso placeholder:', logoUrl);
      return this.generatePlaceholderDataUri(brandName.charAt(0).toUpperCase(), '#0066CC');
    }
    
    return logoUrl; // Dovrebbe essere sicuro
  }

  /**
   * Reset dello stato del servizio
   */
  reset(): void {
    this.brandSuggestions.set([]);
    this.isLoadingBrands.set(false);
    this.isGeneratingIcon.set(false);
  }
}
