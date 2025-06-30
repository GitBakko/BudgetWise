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
  prompt: `You are an expert UI designer. Your task is to select the single best icon from a list that represents a given financial transaction category.

**Instructions:**
1.  Review the category name provided.
2.  Choose the single most fitting icon from the "Available Icons" list.
3.  Return **only** the exact, case-sensitive name of the icon. Do not include any other text, punctuation, or explanation.

**Available Icons:**
${iconList.join(', ')}

---
**Example:**
Category Name: "Cena fuori"
Your Output: UtensilsCrossed
---

**Task:**
Category Name: {{text}}
Your Output:`
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
    const suggestedIcon = output || 'HelpCircle';

    // Validate that the suggested icon is in our list
    if (iconList.includes(suggestedIcon)) {
      return suggestedIcon;
    }
    
    // Fallback if the model returns something invalid
    return "HelpCircle";
  }
);
