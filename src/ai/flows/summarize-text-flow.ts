'use server';
/**
 * @fileOverview A flow to summarize text in simple, understandable terms.
 *
 * - summarizeText - A function that handles the text summarization.
 * - SummarizeTextInput - The input type for the summarizeText function.
 * - SummarizeTextOutput - The return type for the summarizeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SummarizeTextInputSchema = z.object({
  textToSummarize: z.string().describe('The text content to be summarized.'),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summary: z.string().describe('The summarized text in simple, easy-to-understand language.'),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(input: SummarizeTextInput): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const summarizeTextPrompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are a helpful assistant who is an expert at explaining complex medical documents to patients.
  Summarize the following medical report text in simple, easy-to-understand terms.
  Avoid jargon where possible, or explain it clearly if it's necessary.
  The goal is to make the information accessible to someone without a medical background.

  Medical Report Text:
  {{{textToSummarize}}}
  `,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async (input) => {
    const {output} = await summarizeTextPrompt(input);
    return output!;
  }
);
