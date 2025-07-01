'use server';
/**
 * @fileOverview An AI flow to extract multiple transactions from a screenshot.
 * - extractTransactions - Parses an image and returns an array of structured transaction data.
 * - ExtractTransactionsInput - Input type for extractTransactions.
 * - ExtractedTransaction - The type for a single extracted transaction.
 * - ExtractTransactionsOutput - Output type for extractTransactions.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExtractTransactionsInputSchema = z.object({
  screenshotDataUri: z
    .string()
    .describe(
      "A screenshot of a list of transactions, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTransactionsInput = z.infer<typeof ExtractTransactionsInputSchema>;

const ExtractedTransactionSchema = z.object({
  description: z.string().describe('The description of the transaction (e.g., merchant name, payment recipient).'),
  amount: z.number().describe('The transaction amount as a number. Infer if it is an income (positive) or expense (negative), but return an absolute positive number.'),
  transactionDate: z.string().optional().describe('The date of the transaction. Return it in YYYY-MM-DD format. If the year is not present, assume the current year.'),
  type: z.enum(['income', 'expense']).describe("The type of transaction. Infer this from context (e.g., 'Payment to' is an expense, 'Payment from' is an income). Default to 'expense' if unsure.")
});
export type ExtractedTransaction = z.infer<typeof ExtractedTransactionSchema>;

const ExtractTransactionsOutputSchema = z.array(ExtractedTransactionSchema);
export type ExtractTransactionsOutput = z.infer<typeof ExtractTransactionsOutputSchema>;


export async function extractTransactions(input: ExtractTransactionsInput): Promise<ExtractTransactionsOutput> {
  return extractTransactionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractTransactionsPrompt',
  input: { schema: ExtractTransactionsInputSchema },
  output: { schema: ExtractTransactionsOutputSchema },
  prompt: `You are an expert financial data entry assistant. Your task is to analyze the provided screenshot of a list of transactions (like from a bank statement, PayPal, or other financial apps) and extract each individual transaction row.

**Instructions:**
1.  Carefully scan the image and identify each distinct transaction entry.
2.  For each transaction, extract the description, the amount, and the date.
3.  Determine if the transaction is an 'income' or an 'expense' based on keywords, context (e.g., "payment from" vs "payment to", "+", "-"), or column headers. If you cannot be certain, default to 'expense'.
4.  The 'amount' should always be a positive number. The 'type' field will indicate if it's an expense or income.
5.  Format the date as 'YYYY-MM-DD'. If the year is missing from the date (e.g., "Jul 15"), assume the current year.
6.  Ignore any table headers, summary rows (like "Total" or "Balance"), account information, or any other text that is not a specific transaction line item.
7.  Return the data as a JSON array of objects, where each object represents one transaction.

Screenshot: {{media url=screenshotDataUri}}`,
});

const extractTransactionsFlow = ai.defineFlow(
  {
    name: 'extractTransactionsFlow',
    inputSchema: ExtractTransactionsInputSchema,
    outputSchema: ExtractTransactionsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output || [];
  }
);
