'use server';
/**
 * @fileOverview An AI flow to suggest an icon for a transaction category.
 *
 * - suggestCategoryIcon - A function that suggests an icon for a category name.
 * - SuggestCategoryIconInput - The input type for the suggestCategoryIcon function.
 * - SuggestCategoryIconOutput - The return type for the suggestCategoryIcon function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const iconList = [ "ShoppingCart", "Home", "Car", "UtensilsCrossed", "Film", "Plane", "HeartPulse", "Gift", "BookOpen", "Briefcase", "GraduationCap", "PawPrint", "Landmark", "DollarSign", "Receipt", "Bus", "Train", "Bike", "Fuel", "Shirt", "Apple", "Pizza", "Coffee", "Gamepad2", "Laptop", "Phone", "Music", "Heart", "Star", "Cloud", "Sun", "Moon", "Droplets", "Bone", "Dog", "Cat", "Hammer", "Wrench", "Construction", "Baby", "HelpCircle" ];

const SuggestCategoryIconInputSchema = z.string();
export type SuggestCategoryIconInput = z.infer<typeof SuggestCategoryIconInputSchema>;

const SuggestCategoryIconOutputSchema = z.string();
export type SuggestCategoryIconOutput = z.infer<typeof SuggestCategoryIconOutputSchema>;

export async function suggestCategoryIcon(categoryName: SuggestCategoryIconInput): Promise<SuggestCategoryIconOutput> {
  return suggestCategoryIconFlow(categoryName);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryIconPrompt',
  input: {schema: SuggestCategoryIconInputSchema},
  output: {schema: SuggestCategoryIconOutputSchema.nullable()},
  prompt: `Sei un esperto UI designer. Il tuo compito è selezionare la migliore icona singola da un elenco che rappresenti una data categoria di transazione finanziaria.

**Istruzioni:**
1. Analizza il nome della categoria fornito.
2. Scegli l'icona singola più adatta dalla lista "Icone Disponibili".
3. Restituisci **solo** il nome esatto dell'icona, rispettando maiuscole e minuscole. Non includere alcun altro testo, punteggiatura o spiegazione. Se nessuna icona è adatta, restituisci "HelpCircle".

**Icone Disponibili:**
${iconList.join(', ')}

---
**Esempio 1:**
Nome Categoria: "Cena fuori"
La tua risposta: UtensilsCrossed
---
**Esempio 2:**
Nome Categoria: "Stipendio"
La tua risposta: DollarSign
---
**Esempio 3:**
Nome Categoria: "Regalo per la nonna"
La tua risposta: Gift
---
**Esempio 4:**
Nome Categoria: "Abbonamento Netflix"
La tua risposta: Film
---

**Tocca a te:**
Nome Categoria: {{text}}
La tua risposta:`
});

const suggestCategoryIconFlow = ai.defineFlow(
  {
    name: 'suggestCategoryIconFlow',
    inputSchema: SuggestCategoryIconInputSchema,
    outputSchema: SuggestCategoryIconOutputSchema,
  },
  async (categoryName) => {
    if (!categoryName) {
      return "ShoppingCart"; // Default icon
    }
    const {output} = await prompt(categoryName);
    const suggestedIcon = output?.trim();

    // Validate that the suggested icon is in our list
    if (suggestedIcon && iconList.includes(suggestedIcon)) {
      return suggestedIcon;
    }
    
    // Fallback if the model returns something invalid
    return "HelpCircle";
  }
);
