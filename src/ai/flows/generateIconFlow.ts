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
      prompt: `You are an expert logo designer for a financial app. Your task is to create a simple, clean, modern, circular, vector-style icon for a bank account.

The account name is: "${accountName}".

First, determine if the account name refers to a well-known financial institution (e.g., a bank, a fintech company like 'Intesa San Paolo', 'Poste Italiane', 'Revolut', 'N26', 'Unicredit').

- If it IS a known institution: Create an icon that is a simplified, modern, and abstract representation of the institution's official logo. Use its primary brand color for the background and a white icon. The result should be recognizable but not a direct copy. Do not include any text.

- If it is NOT a known institution (e.g., 'Risparmi per le vacanze', 'Cassa comune', 'Conto principale'): Generate a generic but elegant icon that represents the concept of the account name. Use a pleasant color for the background and a white icon. Do not include any text.

The final output must be a single, circular icon.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    return media.url || '';
  }
);
