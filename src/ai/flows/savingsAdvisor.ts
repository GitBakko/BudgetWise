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
      return "Non ho dati sulle transazioni da analizzare. Aggiungi alcune spese per ottenere suggerimenti di risparmio.";
    }

    const prompt = `Sei un consulente finanziario amichevole e disponibile. 
    Basandoti sulle seguenti transazioni dell'utente, fornisci 2-3 suggerimenti di risparmio attuabili e personalizzati. 
    Mantieni un tono incoraggiante e positivo. Formatta l'output come una lista markdown.

    Transazioni:
    ${transactions
      .filter(t => t.type === 'expense')
      .map(t => `- ${t.description}: $${t.amount.toFixed(2)} (Categoria: ${t.category})`)
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
