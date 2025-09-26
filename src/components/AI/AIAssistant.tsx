'use client';

import React, { useState } from 'react';
import { fabric } from 'fabric';
import { Sparkles, Palette, Image, Type, Lightbulb, Loader2 } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/utils/helpers';

interface AIAssistantProps {
  canvas: fabric.Canvas | null;
}

export default function AIAssistant({ canvas }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [selectedTool, setSelectedTool] = useState<'text' | 'image' | 'colors' | 'suggestions' | 'analyze'>('text');
  
  const {
    generateText,
    generateImage,
    analyzeDesign,
    suggestColorPalette,
    generateDesignSuggestions,
    isGeneratingText,
    isGeneratingImage,
    isAnalyzing,
    error
  } = useAI();

  const handleGenerateText = async () => {
    if (!prompt.trim()) return;
    
    try {
      const text = await generateText(prompt);
      if (canvas) {
        // Add text to canvas
        const textObject = new fabric.Text(text, {
          left: 100,
          top: 100,
          fontSize: 20,
          fill: '#000000'
        });
        canvas.add(textObject);
        canvas.setActiveObject(textObject);
        canvas.renderAll();
      }
    } catch (error) {
      console.error('Text generation failed:', error);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    
    try {
      const imageUrl = await generateImage(prompt);
      if (canvas) {
        // Add image to canvas
        fabric.Image.fromURL(imageUrl, (img: fabric.Image) => {
          img.set({
            left: 100,
            top: 100,
            scaleX: 0.5,
            scaleY: 0.5
          });
          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
    }
  };

  const handleSuggestColors = async () => {
    if (!prompt.trim()) return;
    
    try {
      const colors = await suggestColorPalette(prompt);
      // You could show these colors in a palette or apply them to the canvas
      console.log('Suggested colors:', colors);
    } catch (error) {
      console.error('Color suggestion failed:', error);
    }
  };

  const handleAnalyzeDesign = async () => {
    if (!canvas) return;
    
    try {
      const canvasData = canvas.toJSON();
      const analysis = await analyzeDesign(canvasData);
      console.log('Design analysis:', analysis);
      // You could show this in a modal or panel
    } catch (error) {
      console.error('Design analysis failed:', error);
    }
  };

  const handleGetSuggestions = async () => {
    if (!canvas) return;
    
    try {
      const canvasData = canvas.toJSON();
      const suggestions = await generateDesignSuggestions(canvasData);
      console.log('Design suggestions:', suggestions);
      // You could show these in a suggestions panel
    } catch (error) {
      console.error('Design suggestions failed:', error);
    }
  };

  const tools = [
    { id: 'text', label: 'Generate Text', icon: Type, action: handleGenerateText },
    { id: 'image', label: 'Generate Image', icon: Image, action: handleGenerateImage },
    { id: 'colors', label: 'Color Palette', icon: Palette, action: handleSuggestColors },
    { id: 'analyze', label: 'Analyze Design', icon: Sparkles, action: handleAnalyzeDesign },
    { id: 'suggestions', label: 'Get Suggestions', icon: Lightbulb, action: handleGetSuggestions },
  ];

  const isLoading = isGeneratingText || isGeneratingImage || isAnalyzing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">AI Assistant</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <Sparkles className={cn("w-4 h-4", isOpen && "text-blue-500")} />
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4">
          {/* Tool Selection */}
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setSelectedTool(tool.id as any);
                    tool.action();
                  }}
                  disabled={isLoading}
                  className={cn(
                    "flex items-center space-x-2 p-2 text-xs rounded-lg transition-colors",
                    selectedTool === tool.id
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={() => {
              const tool = tools.find(t => t.id === selectedTool);
              if (tool) tool.action();
            }}
            disabled={isLoading || !prompt.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {isLoading ? 'Generating...' : 'Generate'}
            </span>
          </button>

          {/* Error Display */}
          {error && (
            <div className="p-2 text-xs text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
