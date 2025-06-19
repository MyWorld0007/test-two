// Scans documents using OCR to extract text for digital storage.

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
    // Placeholder implementation for Tesseract OCR.  Replace with actual OCR call.
    // In a real application, this would call Tesseract.js or a similar OCR service.
    // For this example, we'll just return a placeholder text.
    console.log('Calling tesseract tool with ', input.documentDataUri);
    return `OCR Result: This is a sample extracted text from the document. Replace this with real OCR output.`;
  },
});

const scanDocumentPrompt = ai.definePrompt({
  name: 'scanDocumentPrompt',
  input: {schema: ScanDocumentInputSchema},
  output: {schema: ScanDocumentOutputSchema},
  tools: [tesseractTool],
  prompt: `You are a document processing expert. Extract the text from the document using the available tools.

  Document: {{media url=documentDataUri}}

  Use the 'tesseract' tool to extract the text from the document. Return the extracted text.
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
