
'use server';
/**
 * @fileOverview A flow to get detailed brand information from Brandfetch,
 * process it, and prepare it for saving.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getBrandDetails, type BrandDetails } from '@/services/logo-finder';

const GetBrandDetailsInputSchema = z.string().describe("The brandId from Brandfetch.");

const GetBrandDetailsOutputSchema = z.object({
  dataUri: z.string(),
  brandData: z.custom<BrandDetails>(),
  primaryColor: z.string().optional(),
  name: z.string(),
});
export type GetBrandDetailsOutput = z.infer<typeof GetBrandDetailsOutputSchema>;

export async function getBrandDetailsFlow(brandId: string): Promise<GetBrandDetailsOutput> {
  return ai.run("get-brand-details", async () => {
    const details = await getBrandDetails(brandId);
    if (!details) {
      throw new Error("Could not retrieve brand details.");
    }
    
    // Logic to find the best logo format based on quality (pixels per byte)
    const findBestNonSvgFormat = (formats: any[]) => {
        const validFormats = formats.filter(f =>
            f.format !== 'svg' && f.height && f.width && f.size > 0
        );
    
        if (validFormats.length === 0) {
            // Fallback for formats without full dimension/size info
            const simpleFallback = formats.filter(f => f.format !== 'svg');
            return simpleFallback.find(f => f.format === 'png') || simpleFallback[0];
        }
        
        // Sort by "quality" (pixels per byte), descending. A higher ratio is better.
        validFormats.sort((a, b) => {
            const ratioA = (a.width * a.height) / a.size;
            const ratioB = (b.width * b.height) / b.size;
            return ratioB - ratioA;
        });
        
        // The best quality format is the first one after sorting.
        return validFormats[0];
    };

    const iconLogos = details.logos.filter(l => l.type === 'icon');
    let bestLogoFormat = null;

    if (iconLogos.length > 0) {
        const allIconFormats = iconLogos.flatMap(l => l.formats);
        bestLogoFormat = findBestNonSvgFormat(allIconFormats);
    }
    
    // If no suitable icon logo was found, search in all other logo types
    if (!bestLogoFormat) {
        const allFormats = details.logos.flatMap(l => l.formats);
        bestLogoFormat = findBestNonSvgFormat(allFormats);
    }
    
    if (!bestLogoFormat?.src) {
        throw new Error("No suitable logo found in brand details.");
    }
    
    // Fetch the logo, convert to data URI
    const imageResponse = await fetch(bestLogoFormat.src);
    if (!imageResponse.ok) {
        throw new Error(`Failed to fetch logo from ${bestLogoFormat.src}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    
    const contentType = imageResponse.headers.get('content-type') || 'image/png';
    const sanitizedContentType = contentType.split(';')[0];
    
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUri = `data:${sanitizedContentType};base64,${base64}`;

    // Find a primary color
    const primaryColor = details.colors.find(c => c.type === 'accent')?.hex || details.colors[0]?.hex;

    return {
      dataUri,
      brandData: details,
      primaryColor,
      name: details.name,
    };
  });
}
