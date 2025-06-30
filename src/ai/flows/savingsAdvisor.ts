import {defineFlow} from 'genkit';
import {z} from 'zod';
import {ai} from '../genkit';
import {Transaction} from '@/types';

export const savingsAdvisor = defineFlow(
  {
    name: 'savingsAdvisor',
    inputSchema: z.custom<Transaction[]>(),
    outputSchema: z.string(),
  },
  async transactions => {
    if (!transactions || transactions.length === 0) {
      return "I don't have any transaction data to analyze. Please add some expenses to get savings suggestions.";
    }

    const prompt = `You are a friendly and helpful financial advisor.
    Based on the following user transactions, provide 2-3 actionable and personalized savings suggestions.
    Keep the tone encouraging and positive. Format the output as a markdown list.

    Transactions:
    ${transactions
      .filter(t => t.type === 'expense')
      .map(t => `- ${t.description}: $${t.amount.toFixed(2)} (Category: ${t.category})`)
      .join('\n')}
    `;

    const llmResponse = await ai.generate({
      prompt,
      model: 'googleai/gemini-2.0-flash',
      config: {
        temperature: 0.5,
      },
    });

    return llmResponse.text();
  }
);
