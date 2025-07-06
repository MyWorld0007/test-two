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
  summary: z.string().describe(`The summarized text in a specific format:
Name: [Patient name]
Age: [age of patient]
Hospital/Clinic Name: [name of clinic/hospital]
Outcome/Conclusion: [final impression]
Other findings: [other findings]`),
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
  Crucially, convert common medical abbreviations into their full, understandable terms (e.g., "CA" should be explained as "cancer").
  The goal is to make the information accessible to someone without a medical background.

  The output MUST be in the following format. Extract the relevant information from the text to fill in the placeholders. If information is not available for a field, write "N/A".

  Name: [Patient name]
  Age: [age of patient]
  Hospital/Clinic Name: [name of clinic/hospital which is always mentioned on top side]
  Outcome/Conclusion: [final impression such as patient has [disease name] or related to it.]
  Other findings: [Here mentioned other findings]

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
