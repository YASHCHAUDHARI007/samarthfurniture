'use server';

/**
 * @fileOverview A flow to suggest the most likely order status based on order details.
 *
 * - suggestOrderStatus - A function that suggests the order status.
 * - SuggestOrderStatusInput - The input type for the suggestOrderStatus function.
 * - SuggestOrderStatusOutput - The return type for the suggestOrderStatus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOrderStatusInputSchema = z.object({
  orderDetails: z
    .string()
    .describe('The details of the order, including coordinator notes, measurements, and photos.'),
  currentStatus: z
    .string()
    .optional()
    .describe('The current status of the order, if any.'),
});
export type SuggestOrderStatusInput = z.infer<typeof SuggestOrderStatusInputSchema>;

const SuggestOrderStatusOutputSchema = z.object({
  suggestedStatus: z
    .string()
    .describe('The suggested order status based on the order details.'),
  confidence: z
    .number()
    .describe('The confidence level of the suggested status, from 0 to 1.'),
});
export type SuggestOrderStatusOutput = z.infer<typeof SuggestOrderStatusOutputSchema>;

export async function suggestOrderStatus(input: SuggestOrderStatusInput): Promise<SuggestOrderStatusOutput> {
  return suggestOrderStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOrderStatusPrompt',
  input: {schema: SuggestOrderStatusInputSchema},
  output: {schema: SuggestOrderStatusOutputSchema},
  prompt: `You are an AI assistant that helps factory staff determine the most likely production status of an order.

Given the following order details and current status (if any), suggest the most likely status for the order.
Also, provide a confidence level for your suggestion, from 0 to 1.

Order Details: {{{orderDetails}}}
Current Status: {{{currentStatus}}}

Respond with a JSON object that contains the suggested status and the confidence level.`,
});

const suggestOrderStatusFlow = ai.defineFlow(
  {
    name: 'suggestOrderStatusFlow',
    inputSchema: SuggestOrderStatusInputSchema,
    outputSchema: SuggestOrderStatusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
