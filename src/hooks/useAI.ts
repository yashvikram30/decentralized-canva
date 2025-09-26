import { useState, useCallback } from 'react';
import { aiService } from '@/services/aiServices';

export interface AIState {
  isGeneratingText: boolean;
  isGeneratingImage: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    isGeneratingText: false,
    isGeneratingImage: false,
    isAnalyzing: false,
    error: null,
  });

  const generateText = useCallback(async (prompt: string, options?: { maxTokens?: number; temperature?: number }) => {
    try {
      setState(prev => ({ ...prev, isGeneratingText: true, error: null }));
      const result = await aiService.generateText(prompt, options);
      setState(prev => ({ ...prev, isGeneratingText: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isGeneratingText: false,
        error: error instanceof Error ? error.message : 'Text generation failed' 
      }));
      throw error;
    }
  }, []);

  const generateImage = useCallback(async (prompt: string, options?: { size?: string; quality?: string }) => {
    try {
      setState(prev => ({ ...prev, isGeneratingImage: true, error: null }));
      const result = await aiService.generateImage(prompt, options);
      setState(prev => ({ ...prev, isGeneratingImage: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isGeneratingImage: false,
        error: error instanceof Error ? error.message : 'Image generation failed' 
      }));
      throw error;
    }
  }, []);

  const analyzeDesign = useCallback(async (canvasData: any) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
      const result = await aiService.analyzeDesign(canvasData);
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Design analysis failed' 
      }));
      throw error;
    }
  }, []);

  const suggestColorPalette = useCallback(async (description: string) => {
    try {
      setState(prev => ({ ...prev, isGeneratingText: true, error: null }));
      const result = await aiService.suggestColorPalette(description);
      setState(prev => ({ ...prev, isGeneratingText: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isGeneratingText: false,
        error: error instanceof Error ? error.message : 'Color palette generation failed' 
      }));
      throw error;
    }
  }, []);

  const generateDesignSuggestions = useCallback(async (canvasData: any) => {
    try {
      setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
      const result = await aiService.generateDesignSuggestions(canvasData);
      setState(prev => ({ ...prev, isAnalyzing: false }));
      return result;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Design suggestions failed' 
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    generateText,
    generateImage,
    analyzeDesign,
    suggestColorPalette,
    generateDesignSuggestions,
  };
}
