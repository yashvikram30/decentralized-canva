import OpenAI from 'openai';
import { config } from '@/config/environment';

const openai = new OpenAI({
  apiKey: config.useGroq ? config.groqApiKey : config.openaiApiKey,
  baseURL: config.useGroq ? 'https://api.groq.com/openai/v1' : undefined,
});

export async function POST(request: Request) {
  try {
    const { prompt, maxTokens = 500, temperature = 0.7 } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: config.useGroq ? "llama3-8b-8192" : "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: temperature
    });

    return Response.json({ 
      result: completion.choices[0].message.content || '' 
    });

  } catch (error) {
    console.error('AI text generation failed:', error);
    return Response.json({ 
      error: 'AI text generation failed' 
    }, { status: 500 });
  }
}
