import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    const result = await streamText({
      model: openai('gpt-4o-mini'),
      messages: [{ role: 'user', content: 'what is my attendance' }],
    });

    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
main();
