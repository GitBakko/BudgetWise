'use server';
/**
 * @fileOverview An AI flow to generate or find an icon for a bank account.
 *
 * - generateAccountIcon - A function that gets an icon for an account.
 * - GenerateIconInput - The input type for the generateAccountIcon function.
 * - GenerateIconOutput - The return type for the generateAccountIcon function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { findLogoUrl } from '@/services/logo-finder';

const GenerateIconInputSchema = z.string();
type GenerateIconInput = z.infer<typeof GenerateIconInputSchema>;

const GenerateIconOutputSchema = z.string();
type GenerateIconOutput = z.infer<typeof GenerateIconOutputSchema>;

export async function generateAccountIcon(accountName: GenerateIconInput): Promise<GenerateIconOutput> {
  return generateIconFlow(accountName);
}

const generateIconFlow = ai.defineFlow(
  {
    name: 'generateIconFlow',
    inputSchema: GenerateIconInputSchema,
    outputSchema: GenerateIconOutputSchema,
  },
  async (accountName) => {
    // Step 1: Try to find a real, official logo online.
    const officialLogoUrl = await findLogoUrl(accountName);
    if (officialLogoUrl) {
      return officialLogoUrl;
    }

    // Step 2: If no official logo is found, use AI to generate a custom one.
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `You are an expert logo designer for a financial app. Your task is to create a high-quality, square icon with rounded corners (like an iOS app icon) for a personal account.

The account name is: "${accountName}".

Generate a simple, clean, modern, vector-style icon that represents the concept of the account name. The icon should be a single, clear symbol.

**CRITICAL DESIGN RULES (APPLY TO ALL ICONS):**
- **Shape**: The final output MUST be a single, solid-colored square with rounded corners (similar to an iOS app icon).
- **Content Fit**: The symbol inside the square must be large and centered, filling the space appropriately without looking cramped. Avoid excessive empty padding or whitespace around the symbol.
- **Background**: The background of the square should be a single, pleasant, solid color. The symbol on top should be a contrasting color (e.g., white).
- **Borders**: Do NOT add any extra borders, strokes, or outlines around the main square shape. The edge must be clean.
- **Text**: Do NOT include any text, letters, or numbers in the icon.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    return media.url || '';
  }
);
