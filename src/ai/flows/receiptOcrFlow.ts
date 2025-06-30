'use server';
/**
 * @fileOverview An AI flow to parse receipt images.
 * - ocrReceipt - Parses a receipt image and returns structured data.
 * - OcrReceiptInput - Input type for ocrReceipt.
 * - OcrReceiptOutput - Output type for ocrReceipt.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';

const OcrReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OcrReceiptInput = z.infer<typeof OcrReceiptInputSchema>;

const OcrReceiptOutputSchema = z.object({
  merchantName: z.string().optional().describe('The name of the store or merchant. This should be the main title or heading on the receipt.'),
  totalAmount: z.number().optional().describe('The final total amount paid. Look for keywords like "Total", "TOTAL", "Amount Due". It should be a number.'),
  transactionDate: z.string().optional().describe('The date of the transaction. Return it in YYYY-MM-DD format.'),
});
export type OcrReceiptOutput = z.infer<typeof OcrReceiptOutputSchema>;

export async function ocrReceipt(input: OcrReceiptInput): Promise<OcrReceiptOutput> {
  return ocrReceiptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'ocrReceiptPrompt',
  input: { schema: OcrReceiptInputSchema },
  output: { schema: OcrReceiptOutputSchema },
  prompt: `You are an expert receipt scanner. Analyze the provided receipt image and extract the following information.
- merchantName: The name of the store.
- totalAmount: The final total amount paid. It should be a number.
- transactionDate: The date of the transaction. Return it in YYYY-MM-DD format.

If any field is not clearly visible, omit it.

Receipt Image: {{media url=receiptDataUri}}`,
});

const ocrReceiptFlow = ai.defineFlow(
  {
    name: 'ocrReceiptFlow',
    inputSchema: OcrReceiptInputSchema,
    outputSchema: OcrReceiptOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
