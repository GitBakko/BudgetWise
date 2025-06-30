'use server';
/**
 * @fileOverview An AI flow to generate an icon for a bank account.
 *
 * - generateAccountIcon - A function that generates an icon based on an account name.
 * - GenerateIconInput - The input type for the generateAccountIcon function.
 * - GenerateIconOutput - The return type for the generateAccountIcon function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `You are an expert logo designer for a financial app. Your task is to create a high-quality, circular icon for a bank account.

The account name is: "${accountName}".

Your process is as follows:

1.  **Analyze the Name**: First, determine if the account name refers to a well-known financial institution (e.g., a bank, a fintech company like 'Intesa San Paolo', 'Poste Italiane', 'Revolut', 'N26', 'Unicredit').

2.  **Generate the Icon**:
    *   **If it IS a known institution**: Your primary goal is to generate an image that is a FAITHFUL and ACCURATE reproduction of the institution's official logo. The logo should be centered within a perfect circle. The background color of the circle should be the institution's primary brand color, and the logo itself should be white, or vice-versa, to ensure high contrast and recognizability. The result should look professional and clean.
    *   **If it is NOT a known institution** (e.g., 'Risparmi per le vacanze', 'Cassa comune', 'Conto principale'): Generate a simple, clean, modern, vector-style icon that represents the concept of the account name. The icon should be white, placed on a pleasant, solid-colored circular background.

**CRITICAL DESIGN RULES (APPLY TO ALL ICONS):**
- **Shape**: The final output MUST be a single, perfect circle.
- **Borders**: Do NOT add any borders, strokes, or outlines around the circle. The edge should be clean. Avoid any "white borders with different thicknesses" as this is visually disruptive.
- **Text**: Do NOT include any text in the icon, unless it is part of the official logo itself.
- **Size**: The icon within the circle should be appropriately sized to fill the space without being cramped.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    return media.url || '';
  }
);
