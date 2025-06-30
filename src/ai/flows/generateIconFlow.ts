'use server';
/**
 * @fileOverview An AI flow to generate an icon for a bank account.
 *
 * - generateAccountIcon - A function that generates an icon based on an account name.
 * - GenerateIconInputSchema - The input type for the generateAccountIcon function.
 * - GenerateIconOutputSchema - The return type for the generateAccountIcon function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateIconInputSchema = z.string();
export type GenerateIconInput = z.infer<typeof GenerateIconInputSchema>;

export const GenerateIconOutputSchema = z.string();
export type GenerateIconOutput = z.infer<typeof GenerateIconOutputSchema>;

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
      prompt: `Generate a simple, clean, modern, circular, vector-style icon for a bank account named "${accountName}". The icon should be suitable for a financial app. Use a white icon on a colored background. Do not include any text.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });
    
    return media.url || '';
  }
);
