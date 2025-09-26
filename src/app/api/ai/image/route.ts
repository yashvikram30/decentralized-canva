import OpenAI from 'openai';
import { config } from '@/config/environment';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function POST(request: Request) {
  try {
    const { prompt, size = "1024x1024", quality = "standard" } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const response = await openai.images.generate({
      prompt,
      size: size as any,
      quality: quality as any,
      n: 1
    });

    return Response.json({ 
      result: response.data?.[0]?.url || '' 
    });

  } catch (error) {
    console.error('AI image generation failed:', error);
    return Response.json({ 
      error: 'AI image generation failed' 
    }, { status: 500 });
  }
}
