import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';

const groq = createGroq({
  apiKey: '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',
});

async function main() {
  try {
    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      messages: [{ role: 'user', content: 'Say hello in one sentence' }],
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
    console.log('\n--- SUCCESS ---');
  } catch (error) {
    console.error("Error:", error.message || error);
  }
}
main();
