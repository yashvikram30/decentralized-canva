import OpenAI from 'openai';
import { config } from '@/config/environment';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function POST(request: Request) {
  try {
    const { canvasData, type } = await request.json();

    if (!canvasData) {
      return Response.json({ error: 'Canvas data is required' }, { status: 400 });
    }

    let prompt: string;
    let fallback: any;

    if (type === 'colorPalette') {
      prompt = `Suggest a 5-color palette for: ${JSON.stringify(canvasData, null, 2)}. Return as JSON array of hex colors.`;
      fallback = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    } else {
      prompt = `Based on this design, suggest 3 improvements: ${JSON.stringify(canvasData, null, 2)}. Return as a JSON array of suggestions.`;
      fallback = [
        'Add more contrast between elements',
        'Consider using a consistent color scheme',
        'Improve text readability'
      ];
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.7
    });

    const response = completion.choices[0].message.content || '';
    
    try {
      const parsed = JSON.parse(response);
      return Response.json({ result: parsed });
    } catch {
      return Response.json({ result: fallback });
    }

  } catch (error) {
    console.error('AI suggestions failed:', error);
    return Response.json({ 
      error: 'AI suggestions failed' 
    }, { status: 500 });
  }
}
