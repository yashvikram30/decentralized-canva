'use client';

import React, { useState } from 'react';
import { Image, Loader2, Download, Copy } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/utils/helpers';

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
  className?: string;
}

export default function ImageGenerator({ onImageGenerated, className }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageQuality, setImageQuality] = useState('standard');
  
  const { generateImage, isGeneratingImage, error } = useAI();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      const imageUrl = await generateImage(prompt, {
        size: imageSize,
        quality: imageQuality
      });
      setGeneratedImage(imageUrl);
      onImageGenerated?.(imageUrl);
    } catch (error) {
      console.error('Image generation failed:', error);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'generated-image.png';
    link.click();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedImage);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const imageTypes = [
    { id: 'icon', label: 'Icon', prompt: 'Create a clean, minimal icon for: ' },
    { id: 'illustration', label: 'Illustration', prompt: 'Create a modern illustration of: ' },
    { id: 'pattern', label: 'Pattern', prompt: 'Create a subtle pattern for: ' },
    { id: 'background', label: 'Background', prompt: 'Create a background image for: ' },
  ];

  const sizes = [
    { value: '256x256', label: '256×256' },
    { value: '512x512', label: '512×512' },
    { value: '1024x1024', label: '1024×1024' },
    { value: '1792x1024', label: '1792×1024' },
    { value: '1024x1792', label: '1024×1792' },
  ];

  const qualities = [
    { value: 'standard', label: 'Standard' },
    { value: 'hd', label: 'HD' },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <Image className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Image Generator</h3>
      </div>

      {/* Image Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {imageTypes.map((type) => (
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
          placeholder="Describe the image you want to generate..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
        />
      </div>

      {/* Image Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size
          </label>
          <select
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sizes.map((size) => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality
          </label>
          <select
            value={imageQuality}
            onChange={(e) => setImageQuality(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {qualities.map((quality) => (
              <option key={quality.value} value={quality.value}>
                {quality.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGeneratingImage || !prompt.trim()}
        className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGeneratingImage ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Image className="w-4 h-4" />
        )}
        <span>
          {isGeneratingImage ? 'Generating...' : 'Generate Image'}
        </span>
      </button>

      {/* Generated Image */}
      {generatedImage && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Generated Image
            </label>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyUrl}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
              >
                <Copy className="w-3 h-3" />
                <span>Copy URL</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-auto max-h-64 object-contain"
            />
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
