'use server';
/**
 * @fileOverview An AI flow to scan a document, extract text, and return a structured summary.
 *
 * - scanDocument - A function that handles the document scanning and summarization.
 */
import {ai} from '@/ai/genkit';
import {
  ScanDocumentInputSchema,
  StructuredDocumentSummarySchema,
} from '@/lib/types';
import {z} from 'zod';

export type ScanDocumentInput = z.infer<typeof ScanDocumentInputSchema>;
export type ScanDocumentOutput = z.infer<
  typeof StructuredDocumentSummarySchema
>;

export async function scanDocument(
  input: ScanDocumentInput
): Promise<ScanDocumentOutput> {
  return scanDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanDocumentPrompt',
  input: {schema: ScanDocumentInputSchema},
  output: {schema: StructuredDocumentSummarySchema},
  prompt: `You are an expert at analyzing medical documents. Extract the text from the following document and provide a structured summary.

Document to analyze:
{{media url=documentDataUri}}

Your output MUST be in the format defined by the output schema.
- For 'outcome', provide a concise summary of 2-3 sentences explaining the findings in simple, understandable terms.
- If a value for a field is not available in the text, you must return "N/A".
- For the 'category' field, classify the document into one of the following: 'Lab', 'Clinical', 'Hospital', 'Estimate', 'Other'.
- For 'extractedText', provide the full text you extracted from the document.`,
});

const scanDocumentFlow = ai.defineFlow(
  {
    name: 'scanDocumentFlow',
    inputSchema: ScanDocumentInputSchema,
    outputSchema: StructuredDocumentSummarySchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to get a structured response from the AI model.');
    }
    return output;
  }
);
