import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createAnthropic } from '@ai-sdk/anthropic';
// ollama provider can be added similarly if needed

export const getAIProvider = () => {
  const provider = process.env.AI_PROVIDER || 'GEMINI';

  switch (provider.toUpperCase()) {
    case 'OPENAI': {
      const openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      return openai('gpt-4o-mini');
    }
    case 'ANTHROPIC': {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      return anthropic('claude-3-haiku-20240307');
    }
    case 'GEMINI':
    default: {
      const google = createGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
      });
      return google('gemini-2.0-flash');
    }
  }
};
