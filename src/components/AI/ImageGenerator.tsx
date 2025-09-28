'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Download, Copy } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/utils/helpers';
import Image from 'next/image';

interface ImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
  className?: string;
}

export default function ImageGenerator({ onImageGenerated, className }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(40);
  const [cfgScale, setCfgScale] = useState(5);
  
  const { generateImage, isGeneratingImage, error } = useAI();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      const imageUrl = await generateImage(prompt, {
        width,
        height,
        steps,
        cfg_scale: cfgScale
      });
      
      // Check if we got a valid image URL
      if (imageUrl && imageUrl.trim() !== '') {
        setGeneratedImage(imageUrl);
        onImageGenerated?.(imageUrl);
      } else {
        console.warn('API returned empty image URL');
        // Don't set empty image, let error state handle it
      }
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

  const sizePresets = [
    { width: 1024, height: 1024, label: 'Square (1024×1024)' },
    { width: 1152, height: 896, label: 'Landscape (1152×896)' },
    { width: 896, height: 1152, label: 'Portrait (896×1152)' },
    { width: 1216, height: 832, label: 'Wide (1216×832)' },
    { width: 832, height: 1216, label: 'Tall (832×1216)' },
  ];

  const stepOptions = [
    { value: 20, label: 'Fast (20 steps)' },
    { value: 40, label: 'Balanced (40 steps)' },
    { value: 60, label: 'High Quality (60 steps)' },
  ];

  const cfgScaleOptions = [
    { value: 3, label: 'Creative (3)' },
    { value: 5, label: 'Balanced (5)' },
    { value: 7, label: 'Precise (7)' },
    { value: 10, label: 'Very Precise (10)' },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-2">
        <ImageIcon className="w-5 h-5 text-purple-600" />
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
      <div className="space-y-4">
        {/* Size Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Size
          </label>
          <div className="grid grid-cols-1 gap-2">
            {sizePresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setWidth(preset.width);
                  setHeight(preset.height);
                }}
                className={`p-2 text-sm text-left rounded-lg border transition-colors ${
                  width === preset.width && height === preset.height
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
              min="512"
              max="1536"
              step="64"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
              min="512"
              max="1536"
              step="64"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Generation Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steps
            </label>
            <select
              value={steps}
              onChange={(e) => setSteps(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {stepOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CFG Scale
            </label>
            <select
              value={cfgScale}
              onChange={(e) => setCfgScale(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {cfgScaleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
          <ImageIcon className="w-4 h-4" />
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
            <Image
              src={generatedImage}
              alt="Generated"
              width={400}
              height={256}
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
