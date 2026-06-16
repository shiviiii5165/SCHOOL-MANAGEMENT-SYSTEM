import { streamText, stepCountIs, tool } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { z } from 'zod';

const groq = createGroq({
  apiKey: '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',
});

async function main() {
  try {
    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: 'CRITICAL: After calling a tool and receiving the result, YOU MUST immediately generate a final text response answering the user\'s question. DO NOT call the same tool repeatedly. DO NOT loop.',
      messages: [{ role: 'user', content: 'What is the weather in Paris?' }],
      tools: {
        get_weather: tool({
          description: 'Get the weather',
          parameters: z.object({ location: z.string() }),
          execute: async ({ location }) => {
            console.log('--- EXECUTING TOOL ---', location);
            return { temperature: 22, condition: 'Sunny' };
          }
        })
      },
      stopWhen: stepCountIs(3),
    });

    const stream = result.toUIMessageStreamResponse();
    const reader = stream.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      console.log(decoder.decode(value));
    }
    console.log('\n--- SUCCESS ---');
  } catch (error) {
    console.error("Error:", error.message || error);
  }
}
main();
