// Scans documents using OCR to extract text and categorize them for digital storage.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanDocumentInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to scan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanDocumentInput = z.infer<typeof ScanDocumentInputSchema>;

const ScanDocumentOutputSchema = z.object({
  extractedText: z
    .string()
    .describe('The extracted text content from the document.'),
  category: z.enum(['Lab', 'Clinical', 'Hospital', 'Estimate', 'Other'])
    .describe('The determined category of the document.'),
});
export type ScanDocumentOutput = z.infer<typeof ScanDocumentOutputSchema>;

export async function scanDocument(input: ScanDocumentInput): Promise<ScanDocumentOutput> {
  return scanDocumentFlow(input);
}

const tesseractTool = ai.defineTool({
  name: 'tesseract',
  description: 'Use this tool to extract text from a document using OCR technology.',
  inputSchema: z.object({
    documentDataUri: z
      .string()
      .describe("The document to scan, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  }),
  outputSchema: z.string(),
  async handler(input) {
    // Placeholder implementation for Tesseract OCR.
    // For this example, we'll return a placeholder text that implies a lab report to aid categorization.
    console.log('Calling tesseract tool with ', input.documentDataUri.substring(0, 50) + '...');
    return `OCR Result: Patient: John Doe. Blood Test Results. Hemoglobin: 14.5 g/dL. White Blood Cell Count: 7.2 x 10^9/L. This is a sample extracted text from a lab report document.`;
  },
});

const scanDocumentPrompt = ai.definePrompt({
  name: 'scanDocumentPrompt',
  input: {schema: ScanDocumentInputSchema},
  output: {schema: ScanDocumentOutputSchema},
  tools: [tesseractTool],
  prompt: `You are a document processing expert specializing in medical records. Your job is to extract text from a document and classify it into one of the following categories: 'Lab', 'Clinical', 'Hospital', 'Estimate', 'Other'.

  - 'Lab': For laboratory test results.
  - 'Clinical': For doctor's notes, clinical summaries, or prescriptions.
  - 'Hospital': For hospital admission/discharge papers, or surgical reports.
  - 'Estimate': For billing estimates or insurance pre-authorizations.
  - 'Other': For any document that does not fit the above categories.

  Use the 'tesseract' tool to extract the text from the document provided. Based on the extracted text, determine the most appropriate category and return both the text and the category.

  Document: {{media url=documentDataUri}}
  `,
});

const scanDocumentFlow = ai.defineFlow(
  {
    name: 'scanDocumentFlow',
    inputSchema: ScanDocumentInputSchema,
    outputSchema: ScanDocumentOutputSchema,
  },
  async input => {
    const {output} = await scanDocumentPrompt(input);
    return output!;
  }
);
