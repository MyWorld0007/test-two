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
  prescriptionText: z
    .string()
    .describe(
      "The prescription text written by the consultant."
    ),
});
export type ExtractRemindersInput = z.infer<typeof ExtractRemindersInputSchema>;

const ReminderSchema = z.object({
    type: z.enum(['medication', 'appointment']).describe("The type of reminder."),
    title: z.string().describe("For 'medication', the name and dosage (e.g., 'Paracetamol 500mg'). For 'appointment', the title (e.g., 'Follow-up appointment')."),
    dateTime: z.string().datetime().describe("The full date and time for the reminder in ISO 8601 format. This should be the first instance if it's a recurring reminder."),
    endDate: z.string().datetime().optional().describe("For medication with a duration (e.g., 'for 7 days'), this is the end date of the reminder period."),
    notion: z.string().optional().describe("For medication, the instruction on when to take it relative to a meal (e.g., 'before breakfast', 'after dinner')."),
    doctorName: z.string().optional().describe("For appointments, the name of the doctor for the follow-up."),
});

const ExtractRemindersOutputSchema = z.object({
  reminders: z.array(ReminderSchema).describe('A list of reminders extracted from the document.'),
});
export type ExtractRemindersOutput = z.infer<typeof ExtractRemindersOutputSchema>;


export async function extractRemindersFromPrescription(input: ExtractRemindersInput): Promise<ExtractRemindersOutput> {
  return extractRemindersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractRemindersPrompt',
  input: {schema: ExtractRemindersInputSchema},
  output: {schema: ExtractRemindersOutputSchema},
  prompt: `You are an intelligent medical assistant. Your task is to analyze the provided prescription text and extract all medication schedules and follow-up appointments to create a list of structured reminders.

  Today's date is ${new Date().toISOString()}. Use this as the anchor for all date and time calculations.
  
  Follow these time interpretation rules with high precision:
  - If the instruction is "before breakfast", set the time to exactly 8:00 AM.
  - If the instruction is "after breakfast", set the time to exactly 10:00 AM.
  - If the instruction just says "breakfast" without "before" or "after", set the time between 8:00 AM and 10:00 AM.
  - If the instruction is "before lunch", set the time to exactly 1:00 PM (13:00).
  - If the instruction is "after lunch", set the time to exactly 2:00 PM (14:00).
  - If the instruction just says "lunch" without "before" or "after", set the time between 1:00 PM (13:00) and 2:00 PM (14:00).
  - If the instruction is "before dinner" or related to evening, set the time between 7:00 PM (19:00) and 9:00 PM (21:00).
  - If the instruction is "after dinner" or "post dinner", set the time between 9:00 PM (21:00) and 11:00 PM (23:00).
  - For relative dates like "tomorrow", calculate the date based on today.
  - For relative periods like "in 2 weeks", calculate the date from today.

  Analyze the prescription text to create reminders. For each item, populate all relevant fields in the schema.

  - For medications: 
    - Set 'type' to 'medication'.
    - 'title' should be the medication name and dosage (e.g., 'Ibuprofen 200mg').
    - 'dateTime' is the first time the medication should be taken.
    - If a duration is mentioned (e.g., 'for 7 days'), create daily reminders and set the 'endDate' to the last day of the period.
    - Capture any meal-related instructions in the 'notion' field (e.g., 'after breakfast').
  - For appointments: 
    - Set 'type' to 'appointment'.
    - 'title' should be 'Follow-up appointment' or similar.
    - 'dateTime' is the date and time of the appointment.
    - Capture the doctor's name in the 'doctorName' field.

  Create a precise reminder for each event with a full ISO 8601 formatted dateTime.
  
  Prescription Text:
  {{{prescriptionText}}}
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
    
    // If the model returns null, default to an empty list to satisfy the schema.
    if (!output) {
      return { reminders: [] };
    }

    return output;
  }
);
