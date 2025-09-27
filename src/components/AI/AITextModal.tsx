'use client';

import React, { useState } from 'react';
import { fabric } from '@/lib/fabric';
import { Type, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/utils/helpers';

interface AITextModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: fabric.Canvas | null;
  embedded?: boolean;
}

export default function AITextModal({ isOpen, onClose, canvas, embedded = false }: AITextModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState('headline');
  const [generatedText, setGeneratedText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const { generateText, isGeneratingText, error } = useAI();

  const textTypes = [
    { 
      id: 'headline', 
      label: 'Catchy Headline', 
      prompt: 'Write a catchy headline for:', 
      icon: '📰',
      description: 'Perfect for titles and attention-grabbing text'
    },
    { 
      id: 'description', 
      label: 'Product Description', 
      prompt: 'Write a compelling product description for:', 
      icon: '📝',
      description: 'Great for explaining products or services'
    },
    { 
      id: 'cta', 
      label: 'Call to Action', 
      prompt: 'Write a persuasive call-to-action for:', 
      icon: '🎯',
      description: 'Drive user engagement and conversions'
    },
    { 
      id: 'social', 
      label: 'Social Media Post', 
      prompt: 'Write an engaging social media post about:', 
      icon: '📱',
      description: 'Perfect for social media content'
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      const selectedTypeData = textTypes.find(t => t.id === selectedType);
      const fullPrompt = `${selectedTypeData?.prompt} ${prompt}`;
      
      const text = await generateText(fullPrompt);
      setGeneratedText(text);
    } catch (error) {
      console.error('Text generation failed:', error);
    }
  };

  const handleAddToCanvas = async () => {
    if (!canvas || !generatedText) return;
    
    setIsAdding(true);
    
    try {
      // Add text to canvas
      const textObject = new fabric.Text(generatedText, {
        left: canvas.getWidth() / 2,
        top: canvas.getHeight() / 2,
        fontSize: selectedType === 'headline' ? 32 : 20,
        fill: '#000000',
        fontFamily: selectedType === 'headline' ? 'Impact' : 'Arial',
        textAlign: 'center',
        originX: 'center',
        originY: 'center'
      });

      canvas.add(textObject);
      canvas.setActiveObject(textObject);
      canvas.renderAll();
      
      // Close modal after adding
      setTimeout(() => {
        onClose();
        setGeneratedText('');
        setPrompt('');
      }, 500);
      
    } catch (error) {
      console.error('Failed to add text to canvas:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setGeneratedText(''); // Clear previous generation
  };

  if (embedded) {
    return (
      <div className="h-full flex flex-col w-full">
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 w-full">
          {/* Text Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Text Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {textTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={cn(
                    "p-3 text-left rounded-lg border-2 transition-all",
                    selectedType === type.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="font-medium text-sm text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to write about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`${textTypes.find(t => t.id === selectedType)?.prompt} eco-friendly water bottles`}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGeneratingText || !prompt.trim()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingText ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {isGeneratingText ? '🤖 AI is writing...' : 'Generate with AI'}
            </span>
          </button>

          {/* Generated Text */}
          {generatedText && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Generated Text
                </label>
                <div className="text-xs text-gray-500">
                  {generatedText.length} characters
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {generatedText}
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleAddToCanvas}
                  disabled={isAdding}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isAdding ? 'Adding...' : 'Add to Canvas'}</span>
                </button>
                
                <button
                  onClick={() => setGeneratedText('')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Generate New
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              <div className="font-medium">Generation Failed</div>
              <div className="mt-1">{error}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-[9999] flex items-center justify-center p-4",
      isOpen ? "block" : "hidden"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-100"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-[10000]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Text Generator</h2>
              <p className="text-sm text-gray-500">Generate compelling text with AI and add it to your design</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Text Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Text Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {textTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={cn(
                    "p-4 text-left rounded-lg border-2 transition-all",
                    selectedType === type.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What do you want to write about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`${textTypes.find(t => t.id === selectedType)?.prompt} eco-friendly water bottles`}
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGeneratingText || !prompt.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingText ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            <span>
              {isGeneratingText ? '🤖 AI is writing...' : 'Generate with AI'}
            </span>
          </button>

          {/* Generated Text */}
          {generatedText && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Generated Text
                </label>
                <div className="text-xs text-gray-500">
                  {generatedText.length} characters
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {generatedText}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAddToCanvas}
                  disabled={isAdding}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{isAdding ? 'Adding...' : 'Add to Canvas'}</span>
                </button>
                
                <button
                  onClick={() => setGeneratedText('')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Generate New
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
              <div className="font-medium">Generation Failed</div>
              <div className="mt-1">{error}</div>
              <div className="mt-2 text-xs">
                Make sure your OpenAI API key is configured in the environment variables.
              </div>
            </div>
          )}

          {/* AI services now use server-side API routes - no client-side API key needed */}
        </div>
      </div>
    </div>
  );
}
