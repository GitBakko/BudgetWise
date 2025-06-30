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
      prompt: `You are an expert logo designer for a financial app. Your task is to create a high-quality, circular icon for a personal account.

The account name is: "${accountName}".

Generate a simple, clean, modern, vector-style icon that represents the concept of the account name. The icon should be white, placed on a pleasant, solid-colored circular background.

**CRITICAL DESIGN RULES (APPLY TO ALL ICONS):**
- **Shape**: The final output MUST be a single, perfect circle.
- **Borders**: Do NOT add any borders, strokes, or outlines around the circle. The edge should be clean.
- **Text**: Do NOT include any text in the icon.
- **Size**: The icon within the circle should be appropriately sized to fill the space without being cramped.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    return media.url || '';
  }
);
