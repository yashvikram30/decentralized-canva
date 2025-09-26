import OpenAI from 'openai';
import { config } from '@/config/environment';

const openai = new OpenAI({
  apiKey: config.useGroq ? config.groqApiKey : config.openaiApiKey,
  baseURL: config.useGroq ? 'https://api.groq.com/openai/v1' : undefined,
});

export async function POST(request: Request) {
  try {
    const { canvasData } = await request.json();

    if (!canvasData) {
      return Response.json({ error: 'Canvas data is required' }, { status: 400 });
    }

    const prompt = `Analyze this design and provide constructive feedback: ${JSON.stringify(canvasData, null, 2)}`;
    
    const completion = await openai.chat.completions.create({
      model: config.useGroq ? "llama3-8b-8192" : "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });

    return Response.json({ 
      result: completion.choices[0].message.content || '' 
    });

  } catch (error) {
    console.error('AI design analysis failed:', error);
    return Response.json({ 
      error: 'AI design analysis failed' 
    }, { status: 500 });
  }
}
