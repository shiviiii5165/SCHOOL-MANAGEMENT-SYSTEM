import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const google = createGoogleGenerativeAI({
  apiKey: 'AQ.Ab8RN6JLUW8WSIpqfcsBR8EUTxWp9oDiYhi3z8d_D5aOtFaqHA',
});

async function main() {
  try {
    const result = await streamText({
      model: google('gemini-2.0-flash'),
      messages: [{ role: 'user', content: 'hello' }],
    });

    const dec = new TextDecoder();
    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }
    console.log('\n--- SUCCESS ---');
  } catch (error) {
    console.error("Error:", error);
  }
}
main();
