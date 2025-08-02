
'use server';

/**
 * @fileOverview A service to find brand suggestions and details using Brandfetch.
 */

export interface BrandSuggestion {
    src: string;
    source: 'Brandfetch';
    name: string;
    domain: string;
    brandId: string;
}

export interface BrandDetails {
    id: string;
    name: string;
    domain: string;
    description: string;
    links: { name: string; url: string; }[];
    logos: { theme: string; type: string; formats: any[]; }[];
    colors: { hex: string; type: string; }[];
}

/**
 * Searches for brands using the Brandfetch search API.
 * @param companyName The name of the company/account to search for.
 * @returns A promise that resolves to an array of brand suggestions.
 */
export async function searchBrands(companyName: string): Promise<BrandSuggestion[]> {
  if (!companyName || companyName.length < 2) {
    return [];
  }
  
  try {
    // This is a public endpoint and does not require an API key.
    console.log(`[Logo Finder] Searching Brandfetch for "${companyName}"`);
    const searchUrl = `https://api.brandfetch.io/v2/search/${encodeURIComponent(companyName)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
        console.error(`[Brand Service] Brandfetch search failed for "${companyName}": ${response.status} ${response.statusText}`);
        return [];
    }

    const results = await response.json();

    if (!Array.isArray(results)) {
        return [];
    }
    
    const uniqueSuggestions = new Map<string, BrandSuggestion>();
    for (const item of results) {
      // Use image src as the unique key to prevent visually duplicate logos.
      if (item.icon && !item.icon.includes('.svg') && !uniqueSuggestions.has(item.icon)) {
        uniqueSuggestions.set(item.icon, {
          src: item.icon,
          source: 'Brandfetch',
          name: item.name,
          domain: item.domain,
          brandId: item.brandId,
        });
      }
    }
    const suggestions = Array.from(uniqueSuggestions.values());

    console.log(`[Logo Finder] Found ${suggestions.length} unique suggestions from Brandfetch.`);
    return suggestions;

  } catch (error) {
    console.error(`[Brand Service] Error searching brands for "${companyName}":`, error);
    return [];
  }
}


/**
 * Fetches detailed information for a specific brand from Brandfetch.
 * @param brandId The Brandfetch ID of the brand.
 * @returns A promise that resolves to the detailed brand information, or null if not found.
 */
export async function getBrandDetails(brandId: string): Promise<BrandDetails | null> {
    const BRANDFETCH_API_KEY = process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY;

    if (!BRANDFETCH_API_KEY) {
        console.error("[Brand Service] NEXT_PUBLIC_BRANDFETCH_API_KEY is not set. Cannot fetch brand details.");
        throw new Error("La chiave API di Brandfetch non è configurata. Impossibile recuperare i dettagli.");
    }
    
    if (!brandId) return null;

    try {
        console.log(`[Logo Finder] Fetching details for brand ID "${brandId}" from Brandfetch.`);
        const detailsUrl = `https://api.brandfetch.io/v2/brands/${brandId}`;
        const response = await fetch(detailsUrl, {
            headers: { 'Authorization': `Bearer ${BRANDFETCH_API_KEY}` }
        });

        if (!response.ok) {
            console.error(`[Brand Service] Failed to fetch brand details for ID "${brandId}": ${response.status} ${response.statusText}`);
            return null;
        }

        const details = await response.json() as BrandDetails;
        console.log(`[Logo Finder] Successfully fetched details for "${details.name}".`);
        return details;

    } catch (error) {
        console.error(`[Brand Service] Error fetching brand details for ID "${brandId}":`, error);
        return null;
    }
}
