'use client';

import React, { useState } from 'react';
import { Type, Loader2, Copy, Check } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/utils/helpers';

interface TextGeneratorProps {
  onTextGenerated?: (text: string) => void;
  className?: string;
}

export default function TextGenerator({ onTextGenerated, className }: TextGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { generateText, isGeneratingText, error } = useAI();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      const text = await generateText(prompt);
      setGeneratedText(text);
      onTextGenerated?.(text);
    } catch (error) {
      console.error('Text generation failed:', error);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const textTypes = [
    { id: 'headline', label: 'Headline', prompt: 'Write a compelling headline for: ' },
    { id: 'body', label: 'Body Text', prompt: 'Write engaging body text about: ' },
    { id: 'cta', label: 'Call to Action', prompt: 'Write a call-to-action for: ' },
    { id: 'description', label: 'Description', prompt: 'Write a product description for: ' },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <Type className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Text Generator</h3>
      </div>

      {/* Text Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Text Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {textTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setPrompt(type.prompt)}
              className="p-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what text you want to generate..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGeneratingText || !prompt.trim()}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeneratingText ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Type className="w-4 h-4" />
        )}
        <span>
          {isGeneratingText ? 'Generating...' : 'Generate Text'}
        </span>
      </button>

      {/* Generated Text */}
      {generatedText && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Generated Text
            </label>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{generatedText}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
