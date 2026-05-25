import { OpenAI } from 'openai';

// Fallback chain implementation for multi-provider architectures
export class FallbackChain {
  private providers = {
    openai: new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') }),
    // Add other providers as needed for fallback
  };

  async generateResponse(prompt: string, options: any = {}) {
    const providers = ['openai']; // Primary is OpenAI, add fallbacks as needed

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider}...`);

        switch (provider) {
          case 'openai':
            return await this.providers.openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [{ role: 'user', content: prompt }],
              ...options
            });

          // Add other provider implementations here for fallback
          default:
            continue;
        }
      } catch (error) {
        console.warn(`${provider} failed:`, error.message);
        continue;
      }
    }

    throw new Error('All providers failed');
  }
}

export const fallbackChain = new FallbackChain();