'use client';

import React, { useState } from 'react';
import { 
  Type, 
  Square, 
  Circle, 
  Image, 
  Trash2, 
  Palette, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Download,
  MousePointer,
  Sparkles,
  Wand2,
  Upload,
  Save
} from 'lucide-react';
import { fabric } from '@/lib/fabric';
import { cn } from '@/utils/helpers';
import { DrawingMode } from '@/hooks/useCanvas';
import ImageModal from './ImageModal';

interface ToolbarProps {
  canvas: fabric.Canvas | null;
  drawingMode: DrawingMode;
  onAddText: (text: string) => void;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onAddImage: (url: string) => void;
  onDeleteSelected: () => void;
  onClearCanvas: () => void;
  onSetBackgroundColor: (color: string) => void;
  onSetZoom: (zoom: number) => void;
  onSetDrawingMode: (mode: DrawingMode) => void;
  onAIText?: () => void;
  onAIImage?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  zoom: number;
}

export default function Toolbar({
  canvas,
  drawingMode,
  onAddText,
  onAddRectangle,
  onAddCircle,
  onAddImage,
  onDeleteSelected,
  onClearCanvas,
  onSetBackgroundColor,
  onSetZoom,
  onSetDrawingMode,
  onAIText,
  onAIImage,
  onSave,
  onLoad,
  zoom
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const handleAddText = () => {
    // Text is now handled by drawing mode, no need for prompt
    onSetDrawingMode('text');
  };

  const handleImageClick = () => {
    console.log('Image button clicked, opening modal');
    setShowImageModal(true);
  };

  const handleImageModalClose = () => {
    setShowImageModal(false);
  };

  const handleImageAdd = (url: string) => {
    onAddImage(url);
    setShowImageModal(false);
  };

  const handleZoomIn = () => {
    onSetZoom(zoom * 1.2);
  };

  const handleZoomOut = () => {
    onSetZoom(zoom * 0.8);
  };

  const handleExport = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL({ format: 'png' });
      const link = document.createElement('a');
      link.download = 'walrus-canvas-design.png';
      link.href = dataURL;
      link.click();
    }
  };

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Selection Tool */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Selection</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => onSetDrawingMode('select')}
            className={cn(
              "flex items-center justify-center p-3 text-gray-600 rounded-lg transition-colors",
              drawingMode === 'select' 
                ? "bg-blue-100 border-2 border-blue-300" 
                : "bg-gray-50 hover:bg-gray-100 border-2 border-gray-200"
            )}
            title="Select Tool"
          >
            <MousePointer className="w-5 h-5" />
            <span className="ml-2 text-sm font-medium">Select</span>
          </button>
        </div>
      </div>

      {/* Drawing Tools */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Drawing Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleAddText}
            className={cn(
              "flex items-center justify-center p-3 text-gray-600 rounded-lg transition-colors",
              drawingMode === 'text' 
                ? "bg-purple-100 border-2 border-purple-300" 
                : "bg-gray-50 hover:bg-gray-100 border-2 border-gray-200"
            )}
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              console.log('Rectangle button clicked');
              onSetDrawingMode('rectangle');
            }}
            className={cn(
              "flex items-center justify-center p-3 text-gray-600 rounded-lg transition-colors",
              drawingMode === 'rectangle' 
                ? "bg-red-100 border-2 border-red-300" 
                : "bg-gray-50 hover:bg-gray-100 border-2 border-gray-200"
            )}
            title="Draw Rectangle"
          >
            <Square className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              console.log('Circle button clicked');
              onSetDrawingMode('circle');
            }}
            className={cn(
              "flex items-center justify-center p-3 text-gray-600 rounded-lg transition-colors",
              drawingMode === 'circle' 
                ? "bg-green-100 border-2 border-green-300" 
                : "bg-gray-50 hover:bg-gray-100 border-2 border-gray-200"
            )}
            title="Draw Circle"
          >
            <Circle className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleImageClick}
            className="flex items-center justify-center p-3 text-gray-600 rounded-lg transition-colors bg-gray-50 hover:bg-gray-100 border-2 border-gray-200"
            title="Add Image"
          >
            <Image className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* AI Tools */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">AI Tools</h3>
        <div className="space-y-2">
          <button
            onClick={onAIText}
            className="w-full flex items-center justify-center space-x-2 p-3 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            title="AI Text Generation"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">AI Text</span>
          </button>
          
          <button
            onClick={onAIImage}
            className="w-full flex items-center justify-center space-x-2 p-3 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            title="AI Image Generation"
          >
            <Wand2 className="w-5 h-5" />
            <span className="text-sm font-medium">AI Image</span>
          </button>
        </div>
      </div>


      {/* Color Palette */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Background Color</h3>
        <div className="grid grid-cols-5 gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onSetBackgroundColor(color)}
              className={cn(
                "w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform",
                canvas?.backgroundColor === color ? "border-gray-400" : "border-gray-200"
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Zoom Controls */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Zoom</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Storage Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Storage</h3>
        <div className="space-y-2">
          <button
            onClick={onSave}
            className="w-full flex items-center justify-center space-x-2 p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="text-sm">Save to Walrus</span>
          </button>
          
          <button
            onClick={onLoad}
            className="w-full flex items-center justify-center space-x-2 p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Load from Walrus</span>
          </button>
        </div>
      </div>

      

      {/* Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Actions</h3>
        <div className="space-y-2">
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSelected(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSelected(); }}
            className="w-full flex items-center justify-center space-x-2 p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm">Delete Selected</span>
          </button>
          
          <button
            onClick={onClearCanvas}
            className="w-full flex items-center justify-center space-x-2 p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Clear Canvas</span>
          </button>
          
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center space-x-2 p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export PNG</span>
          </button>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={showImageModal}
        onClose={handleImageModalClose}
        onAddImage={handleImageAdd}
      />
      
      
    </div>
  );
}
