'use client';

import React, { useState } from 'react';
import { fabric } from '@/lib/fabric';
import { Wand2, Loader2, Plus, RefreshCw, X, Download } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { cn } from '@/utils/helpers';

interface AIImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: fabric.Canvas | null;
}

export default function AIImageModal({ isOpen, onClose, canvas }: AIImageModalProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('photographic');
  const [selectedSize, setSelectedSize] = useState('square');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const { generateImage, isGeneratingImage, error } = useAI();

  const stylePresets = [
    { 
      id: 'photographic', 
      label: 'Photographic', 
      icon: '📸',
      description: 'Realistic photos',
      prompt: 'high quality photograph, realistic, detailed'
    },
    { 
      id: 'digital', 
      label: 'Digital Art', 
      icon: '🎨',
      description: 'Digital illustrations',
      prompt: 'digital art, illustration, vibrant colors, detailed'
    },
    { 
      id: 'illustration', 
      label: 'Illustration', 
      icon: '✏️',
      description: 'Hand-drawn style',
      prompt: 'illustration, hand-drawn style, artistic, detailed'
    },
    { 
      id: 'abstract', 
      label: 'Abstract', 
      icon: '🌀',
      description: 'Abstract art',
      prompt: 'abstract art, creative, artistic, colorful'
    }
  ];

  const sizeOptions = [
    { id: 'square', label: 'Square', dimensions: '1024x1024' },
    { id: 'portrait', label: 'Portrait', dimensions: '1024x1792' },
    { id: 'landscape', label: 'Landscape', dimensions: '1792x1024' }
  ];

  const fallbackImages = [
    'https://picsum.photos/512/512?random=1',
    'https://picsum.photos/512/512?random=2',
    'https://picsum.photos/512/512?random=3',
    'https://picsum.photos/512/512?random=4',
    'https://picsum.photos/512/512?random=5'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      setGenerationProgress(0);
      
      // Simulate progress for demo
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const selectedStyleData = stylePresets.find(s => s.id === selectedStyle);
      const selectedSizeData = sizeOptions.find(s => s.id === selectedSize);
      
      const fullPrompt = `${selectedStyleData?.prompt}, ${prompt}`;
      
      const imageUrl = await generateImage(fullPrompt, {
        size: selectedSizeData?.dimensions || '1024x1024',
        quality: 'standard'
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      // Use fallback if API fails
      const finalImageUrl = imageUrl || fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
      setGeneratedImage(finalImageUrl);
      
    } catch (error) {
      console.error('Image generation failed:', error);
      // Use fallback image
      setGeneratedImage(fallbackImages[Math.floor(Math.random() * fallbackImages.length)]);
      setGenerationProgress(100);
    }
  };

  const handleAddToCanvas = async () => {
    if (!canvas || !generatedImage) return;
    
    setIsAdding(true);
    
    try {
      // Add image to canvas
      fabric.Image.fromURL(generatedImage, (img: fabric.Image) => {
        // Scale image to fit canvas better
        const maxWidth = canvas.getWidth() * 0.6;
        const maxHeight = canvas.getHeight() * 0.6;
        
        const scaleX = maxWidth / img.width!;
        const scaleY = maxHeight / img.height!;
        const scale = Math.min(scaleX, scaleY, 1);
        
        img.set({
          left: canvas.getWidth() / 2,
          top: canvas.getHeight() / 2,
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center'
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        // Close modal after adding
        setTimeout(() => {
          onClose();
          setGeneratedImage('');
          setPrompt('');
          setGenerationProgress(0);
        }, 500);
      });
      
    } catch (error) {
      console.error('Failed to add image to canvas:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage('');
    setGenerationProgress(0);
    handleGenerate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Wand2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Image Generator</h2>
              <p className="text-sm text-gray-500">Generate custom images with AI and add them to your design</p>
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
          {/* Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Style
            </label>
            <div className="grid grid-cols-2 gap-3">
              {stylePresets.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={cn(
                    "p-4 text-left rounded-lg border-2 transition-all",
                    selectedStyle === style.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{style.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{style.label}</div>
                      <div className="text-xs text-gray-500">{style.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Image Size
            </label>
            <div className="flex space-x-2">
              {sizeOptions.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setSelectedSize(size.id)}
                  className={cn(
                    "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    selectedSize === size.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe the image you want to create
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city at sunset with flying cars and neon lights"
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGeneratingImage || !prompt.trim()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingImage ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5" />
            )}
            <span>
              {isGeneratingImage ? '🎨 AI is creating your image...' : 'Generate Image'}
            </span>
          </button>

          {/* Progress Bar */}
          {isGeneratingImage && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Generating image...</span>
                <span>{generationProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Generated Image */}
          {generatedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Generated Image
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center space-x-1 px-3 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
              
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                  style={{ animation: 'fadeIn 0.5s ease-in' }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = 'ai-generated-image.png';
                      link.click();
                    }}
                    className="opacity-0 hover:opacity-100 transition-opacity p-2 bg-white rounded-full shadow-lg"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
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
                  onClick={() => setGeneratedImage('')}
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
                Using a placeholder image for demo purposes.
              </div>
            </div>
          )}

          {/* AI services now use server-side API routes - no client-side API key needed */}
        </div>
      </div>
    </div>
  );
}
