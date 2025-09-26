export class AIService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/ai';
  }

  async generateText(prompt: string, options: { maxTokens?: number; temperature?: number } = {}): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          maxTokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`AI text generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('AI text generation failed:', error);
      throw error;
    }
  }

  async generateImage(prompt: string, options: { size?: string; quality?: string } = {}): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          size: options.size || "1024x1024",
          quality: options.quality || "standard"
        }),
      });

      if (!response.ok) {
        throw new Error(`AI image generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('AI image generation failed:', error);
      throw error;
    }
  }

  async analyzeDesign(canvasData: any): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ canvasData }),
      });

      if (!response.ok) {
        throw new Error(`AI design analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('AI design analysis failed:', error);
      throw error;
    }
  }

  async suggestColorPalette(description: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          canvasData: { description },
          type: 'colorPalette'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI color palette generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('AI color palette generation failed:', error);
      // Fallback palette if API fails
      return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    }
  }

  async generateDesignSuggestions(canvasData: any): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          canvasData,
          type: 'designSuggestions'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI design suggestions failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('AI design suggestions failed:', error);
      return [
        'Add more contrast between elements',
        'Consider using a consistent color scheme',
        'Improve text readability'
      ];
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
