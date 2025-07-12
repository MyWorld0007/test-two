
'use server';
/**
 * @fileOverview An AI flow to extract reminders from a prescription document.
 * 
 * - extractRemindersFromPrescription - A function to handle the extraction process.
 * - ExtractRemindersInput - The input type for the flow.
 * - ExtractRemindersOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExtractRemindersInputSchema = z.object({
  prescriptionDataUri: z
    .string()
    .describe(
      "The prescription document to scan, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractRemindersInput = z.infer<typeof ExtractRemindersInputSchema>;

const ReminderSchema = z.object({
    title: z.string().describe("The reminder title, e.g., 'Take Paracetamol 500mg' or 'Appointment with Dr. Smith'."),
    dateTime: z.string().datetime().describe("The full date and time for the reminder in ISO 8601 format."),
});

const ExtractRemindersOutputSchema = z.object({
  reminders: z.array(ReminderSchema).describe('A list of reminders extracted from the document.'),
});
export type ExtractRemindersOutput = z.infer<typeof ExtractRemindersOutputSchema>;


export async function extractRemindersFromPrescription(input: ExtractRemindersInput): Promise<ExtractRemindersOutput> {
  return extractRemindersFlow(input);
}

const documentTextExtractorTool = ai.defineTool({
  name: 'documentTextExtractor',
  description: 'Use this tool to extract text from a document (image, PDF, DOCX). This should be the first step for any document analysis.',
  inputSchema: z.object({
    documentDataUri: z
      .string()
      .describe("The document to process, as a data URI."),
  }),
  outputSchema: z.string().describe('The extracted plain text from the document.'),
  async handler(input) {
    // In a real-world scenario, this tool would use libraries like pdf-parse, mammoth.js, or an OCR service
    // to extract text from different file types.
    // For this prototype, we'll simulate the extraction to demonstrate the flow.
    console.log('Calling documentTextExtractorTool...');
    return `
      Patient Name: Jane Doe
      Date: ${new Date().toLocaleDateString()}
      
      Medication:
      - Ibuprofen 200mg. Take 1 tablet twice a day for 5 days.
      - Amoxicillin 500mg. Take 1 tablet every 8 hours for 7 days.
      
      Appointments:
      - Follow-up with Dr. Smith in 2 weeks.
      - Blood test scheduled for tomorrow at 9 AM.
    `;
  },
});


const prompt = ai.definePrompt({
  name: 'extractRemindersPrompt',
  tools: [documentTextExtractorTool],
  input: {schema: ExtractRemindersInputSchema},
  output: {schema: ExtractRemindersOutputSchema},
  prompt: `You are an intelligent medical assistant. Your task is to analyze the provided prescription document and extract all medication schedules and follow-up appointments to create a list of reminders.

  Today's date is ${new Date().toDateString()}. Any mention of "daily", "every day", or specific times should be anchored to today's date for the start.
  - For relative dates like "tomorrow", calculate the date based on today.
  - For relative periods like "in 2 weeks", calculate the date from today.

  First, use the 'documentTextExtractor' tool with the provided 'prescriptionDataUri' to get the text from the document. Then, analyze the extracted text to create reminders.

  - For medications: Identify the medication name, dosage, and frequency (e.g., 'twice a day', 'at 8 am and 8 pm', 'before breakfast'). Create a reminder for each specific time a medication should be taken. If a duration is mentioned (e.g., 'for 7 days'), create daily reminders for that period.
  - For appointments: Identify the date and time of any follow-up appointments mentioned.

  Create a precise reminder for each event with a full ISO 8601 formatted dateTime. The title should be clear and concise.
  `,
});

const extractRemindersFlow = ai.defineFlow(
  {
    name: 'extractRemindersFlow',
    inputSchema: ExtractRemindersInputSchema,
    outputSchema: ExtractRemindersOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    
    // In a real-world scenario, you might have more complex logic here to handle various date/time formats,
    // but for this example, we rely on the LLM's ability to interpret and format the dateTime string correctly.

    return output!;
  }
);
