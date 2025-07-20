
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

const HealthyTipsInputSchema = z.object({
  diseaseName: z.string().describe("The name of the user's primary health condition or disease."),
  stage: z.string().describe("The stage of the disease, if applicable (e.g., 'Stage 2', 'Early')."),
  age: z.number().describe("The user's age in years."),
  gender: z.string().describe("The user's gender (e.g., 'Male', 'Female', 'Other')."),
});
export type HealthyTipsInput = z.infer<typeof HealthyTipsInputSchema>;

const HealthyTipsOutputSchema = z.object({
  exerciseTips: z.array(z.string()).describe('A list of recommended exercises suitable for the user.'),
  dailyDiet: z.object({
    breakfast: z.string().describe("Suggestion for breakfast."),
    lunch: z.string().describe("Suggestion for lunch."),
    dinner: z.string().describe("Suggestion for dinner."),
    snacks: z.string().describe("Suggestion for healthy snacks."),
  }).describe("A sample daily diet plan."),
  weeklyDietPlan: z.array(z.object({
      day: z.string().describe("The day of the week (e.g., Monday)."),
      meals: z.string().describe("A brief description of meals for that day."),
  })).describe("A sample meal plan for a week."),
  thingsToAvoid: z.array(z.string()).describe('A list of foods, ingredients, or habits the user should avoid.'),
});
export type HealthyTipsOutput = z.infer<typeof HealthyTipsOutputSchema>;

export async function generateHealthyTips(input: HealthyTipsInput): Promise<HealthyTipsOutput> {
  return generateHealthyTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHealthyTipsPrompt',
  input: {schema: HealthyTipsInputSchema},
  output: {schema: HealthyTipsOutputSchema},
  prompt: `You are a helpful AI health assistant. Your role is to provide supportive, general wellness advice. You are not a doctor and your advice should not be considered a medical prescription.

  Based on the following user profile, generate a set of healthy lifestyle tips.

  User Profile:
  - Condition: {{{diseaseName}}}
  - Stage: {{{stage}}}
  - Age: {{{age}}}
  - Gender: {{{gender}}}

  Please provide the following:
  1.  **Exercise Tips**: Suggest 3-5 simple, safe exercises.
  2.  **Daily Diet**: Provide a sample meal idea for breakfast, lunch, dinner, and snacks.
  3.  **Weekly Diet Plan**: Outline a brief, sample meal plan for a few days of the week (e.g., Monday, Wednesday, Friday).
  4.  **Things to Avoid**: List 3-5 foods or habits that should be avoided or limited given the user's condition.
  
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
