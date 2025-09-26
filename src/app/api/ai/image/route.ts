import { config } from '@/config/environment';

export async function POST(request: Request) {
  try {
    const { 
      prompt, 
      width = 1024, 
      height = 1024, 
      steps = 40, 
      cfg_scale = 5,
      samples = 1,
      seed = 0 
    } = await request.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Check if we have Stability AI API key for image generation
    if (!config.stabilityApiKey) {
      return Response.json({ 
        error: 'Stability AI API key is required for image generation. Please add STABILITY_API_KEY to your environment variables.' 
      }, { status: 501 });
    }

    // Stability AI SDXL API endpoint
    const apiUrl = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
    
    // Prepare request body for Stability AI
    const requestBody = {
      steps: steps,
      width: width,
      height: height,
      seed: seed,
      cfg_scale: cfg_scale,
      samples: samples,
      text_prompts: [
        {
          text: prompt,
          weight: 1
        }
      ]
    };

    // Make request to Stability AI
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${config.stabilityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Stability AI API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    
    // Extract the first generated image
    if (responseData.artifacts && responseData.artifacts.length > 0) {
      const imageData = responseData.artifacts[0];
      // Convert base64 to data URL
      const imageUrl = `data:image/png;base64,${imageData.base64}`;
      
      return Response.json({ 
        result: imageUrl 
      });
    } else {
      throw new Error('No images generated');
    }

  } catch (error: any) {
    console.error('AI image generation failed:', error);
    
    // Handle specific Stability AI API errors
    if (error.message?.includes('401')) {
      return Response.json({ 
        error: 'Stability AI API key is invalid. Please check your STABILITY_API_KEY.' 
      }, { status: 401 });
    }
    
    if (error.message?.includes('402')) {
      return Response.json({ 
        error: 'Stability AI billing limit reached. Please check your account billing settings.' 
      }, { status: 402 });
    }
    
    if (error.message?.includes('429')) {
      return Response.json({ 
        error: 'Stability AI rate limit exceeded. Please try again later.' 
      }, { status: 429 });
    }
    
    if (error.message?.includes('400')) {
      return Response.json({ 
        error: `Invalid request: ${error.message}` 
      }, { status: 400 });
    }
    
    return Response.json({ 
      error: 'AI image generation failed' 
    }, { status: 500 });
  }
}
