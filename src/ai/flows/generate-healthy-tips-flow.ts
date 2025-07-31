'use server';
/**
 * @fileOverview An AI flow to generate personalized healthy tips for users.
 * 
 * - generateHealthyTips - A function that handles the tip generation process.
 * - HealthyTipsInput - The input type for the flow.
 * - HealthyTipsOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {
  HealthyTipsInputSchema,
  HealthyTipsOutputSchema,
} from '@/lib/types';
export type HealthyTipsInput = z.infer<typeof HealthyTipsInputSchema>;
export type HealthyTipsOutput = z.infer<typeof HealthyTipsOutputSchema>;

export async function generateHealthyTips(input: HealthyTipsInput): Promise<HealthyTipsOutput> {
  return generateHealthyTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthyTipsPrompt',
  input: {schema: HealthyTipsInputSchema},
  output: {schema: HealthyTipsOutputSchema},
  prompt: `You are a helpful AI health assistant. Your role is to provide supportive, general wellness advice. You are not a doctor and your advice should not be considered a medical prescription.

  Based on the following user profile, generate a set of healthy lifestyle tips. Consider the user's age and disease severity when making suggestions. For example, recommend less strenuous exercises for older users or those with advanced stages.

  User Profile:
  - Condition: {{{diseaseName}}}
  - Stage: {{{stage}}}
  - Age: {{{age}}}
  - Gender: {{{gender}}}
  - Dietary Preference: {{{dietaryPreference}}}

  {{#if userQuery}}
  The user has a specific request: "{{{userQuery}}}"
  Incorporate this request into your suggestions ONLY IF it is related to diet or exercise. If the query is unrelated (e.g., asking for financial advice, a joke, etc.), IGNORE the user's query and generate the standard health tips based on their profile.
  {{/if}}

  Please provide the following:
  1.  **Exercise Tips**: Suggest 3-5 simple, safe exercises.
  2.  **Daily Diet**: Provide a sample meal idea for breakfast, lunch, dinner, and snacks for a single day, strictly adhering to the user's dietary preference (Veg, Non-Veg, or Both).
  3.  **Weekly Diet Plan**: Outline a brief, sample meal plan for a few days of the week (e.g., Monday, Wednesday, Friday), strictly adhering to the user's dietary preference.
  4.  **Monthly Diet Plan**: Provide a high-level plan for a month, broken into 4 weeks. For each week, suggest a general dietary theme or focus, keeping the user's dietary preference in mind.
  5.  **Things to Avoid**: List 3-5 foods or habits that should be avoided or limited given the user's condition.
  
  Keep the advice practical, easy to understand, and encouraging. Frame it as general guidance for a healthier lifestyle.
  `,
});

const generateHealthyTipsFlow = ai.defineFlow(
  {
    name: 'generateHealthyTipsFlow',
    inputSchema: HealthyTipsInputSchema,
    outputSchema: HealthyTipsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('The AI model could not generate healthy tips based on the provided profile.');
    }
    return output;
  }
);
