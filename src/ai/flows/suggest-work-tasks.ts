'use server';

/**
 * @fileOverview An AI agent that suggests work tasks needed to move an order forward.
 *
 * - suggestWorkTasks - A function that suggests work tasks based on the order's current status.
 * - SuggestWorkTasksInput - The input type for the suggestWorkTasks function.
 * - SuggestWorkTasksOutput - The return type for the suggestWorkTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWorkTasksInputSchema = z.object({
  orderStatus: z
    .string()
    .describe('The current status of the order, e.g., "Design Complete", "Awaiting Materials", "In Production", etc.'),
  orderDetails: z.string().optional().describe('Additional details about the order, such as specific requirements or complications.'),
});
export type SuggestWorkTasksInput = z.infer<typeof SuggestWorkTasksInputSchema>;

const SuggestWorkTasksOutputSchema = z.object({
  suggestedTasks: z
    .array(z.string())
    .describe('A list of suggested work tasks to move the order forward.'),
  reasoning: z
    .string()
    .describe('The AI agent explains why it is suggesting these tasks.'),
});
export type SuggestWorkTasksOutput = z.infer<typeof SuggestWorkTasksOutputSchema>;

export async function suggestWorkTasks(input: SuggestWorkTasksInput): Promise<SuggestWorkTasksOutput> {
  return suggestWorkTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWorkTasksPrompt',
  input: {schema: SuggestWorkTasksInputSchema},
  output: {schema: SuggestWorkTasksOutputSchema},
  prompt: `You are an AI assistant helping factory staff determine the next work tasks for a furniture order.

  Based on the current order status and any additional details, suggest a list of specific work tasks needed to move the order forward. Also explain your reasoning for suggesting these tasks.

  Current Order Status: {{{orderStatus}}}
  Order Details: {{{orderDetails}}}

  Provide the list of suggested tasks and the reasoning in the output.`,
});

const suggestWorkTasksFlow = ai.defineFlow(
  {
    name: 'suggestWorkTasksFlow',
    inputSchema: SuggestWorkTasksInputSchema,
    outputSchema: SuggestWorkTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
