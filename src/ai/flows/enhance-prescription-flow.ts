
'use server';
/**
 * @fileOverview An AI flow to enhance and clarify prescription text.
 * 
 * - enhancePrescription - A function that handles the prescription enhancement.
 * - EnhancePrescriptionInput - The input type for the flow.
 * - EnhancePrescriptionOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const EnhancePrescriptionInputSchema = z.object({
  prescriptionText: z
    .string()
    .describe("The raw prescription text written by the consultant."),
});
export type EnhancePrescriptionInput = z.infer<typeof EnhancePrescriptionInputSchema>;

const EnhancePrescriptionOutputSchema = z.object({
  enhancedText: z.string().describe('The AI-enhanced and clarified prescription text.'),
});
export type EnhancePrescriptionOutput = z.infer<typeof EnhancePrescriptionOutputSchema>;


export async function enhancePrescription(input: EnhancePrescriptionInput): Promise<EnhancePrescriptionOutput> {
  return enhancePrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhancePrescriptionPrompt',
  input: {schema: EnhancePrescriptionInputSchema},
  output: {schema: EnhancePrescriptionOutputSchema},
  prompt: `You are a medical scribe assistant. Your task is to take a doctor's raw prescription notes and enhance them for clarity, consistency, and completeness. Do not add any information that is not present in the original text, but reformat it for better understanding.

  - Standardize medication names and dosages (e.g., "para 500mg" becomes "Paracetamol 500mg").
  - Clarify instructions (e.g., "bd" becomes "twice a day").
  - Ensure instructions for each medication are on a new line.
  - Correct any minor spelling errors.
  - If a follow-up is mentioned, format it clearly (e.g., "Follow-up with [Doctor's Name] in [time period].").

  Return only the enhanced text.

  Original Prescription Text:
  {{{prescriptionText}}}
  `,
});

const enhancePrescriptionFlow = ai.defineFlow(
  {
    name: 'enhancePrescriptionFlow',
    inputSchema: EnhancePrescriptionInputSchema,
    outputSchema: EnhancePrescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      // If the model fails, return the original text to avoid data loss.
      return { enhancedText: input.prescriptionText };
    }
    return output;
  }
);
