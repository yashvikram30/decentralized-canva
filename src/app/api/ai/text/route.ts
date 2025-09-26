import OpenAI from 'openai';
import { config } from '@/config/environment';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function POST(request: Request) {
  try {
    const { prompt, maxTokens = 500, temperature = 0.7 } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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
