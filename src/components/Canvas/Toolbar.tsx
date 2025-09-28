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
  X,
  Sparkles,
  Wand2,
  Upload,
  Save,
  Pencil
} from 'lucide-react';
import CollapsibleSection from '../retro-ui/collapsible-section';
import { fabric } from '@/lib/fabric';
import { cn } from '@/utils/helpers';
import { DrawingMode } from '@/hooks/useCanvas';
// Image upload modal is managed at the CanvasEditor level

interface ToolbarProps {
  canvas: fabric.Canvas | null;
  drawingMode: DrawingMode;
  onAddText: (text: string) => void;
  onAddRectangle: () => void;
  onAddCircle: () => void;
  onDeleteSelected: () => void;
  onClearCanvas: () => void;
  onSetBackgroundColor: (color: string) => void;
  onSetZoom: (zoom: number) => void;
  onSetDrawingMode: (mode: DrawingMode) => void;
  onSetTool: (tool: 'select' | 'text' | 'rectangle' | 'circle' | 'image' | 'pencil') => void;
  onAIText?: () => void;
  onAIImage?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  zoom: number;
  isWalletConnected?: boolean;
}

export default function Toolbar({
  canvas,
  drawingMode,
  onAddText,
  onAddRectangle,
  onAddCircle,
  onDeleteSelected,
  onClearCanvas,
  onSetBackgroundColor,
  onSetZoom,
  onSetDrawingMode,
  onSetTool,
  onAIText,
  onAIImage,
  onSave,
  onLoad,
  zoom,
  isWalletConnected = false
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleAddText = () => {
    // Text is now handled by drawing mode, no need for prompt
    onSetDrawingMode('text');
    onSetTool('text');
  };

  const handleImageClick = () => {
    onSetTool('image');
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
    // Row 1: Primary Colors (10 colors) - Very vibrant
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8000', '#800080',
    // Row 2: Secondary Colors (10 colors) - Bright and clear
    '#FF4444', '#00CCCC', '#4488FF', '#44FF44', '#FFFF44', '#FF44FF', '#44FFFF', '#FF8844', '#8844FF', '#FF44CC',
    // Row 3: Vibrant Colors (10 colors) - High saturation
    '#FF1493', '#32CD32', '#FF6347', '#00CED1', '#FF4500', '#9370DB', '#20B2AA', '#FF69B4', '#FFD700', '#FFA500',
    // Row 4: Pastel Colors (10 colors) - Soft but visible
    '#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD', '#F0E68C', '#FFA07A', '#20B2AA', '#FFC0CB', '#D8BFD8', '#F5DEB3',
    // Row 5: Dark Colors (10 colors) - Rich and deep
    '#8B0000', '#006400', '#00008B', '#B8860B', '#800080', '#008B8B', '#2F4F4F', '#8B4513', '#2E8B57', '#4B0082'
  ];

  return (
    <div className="px-4 py-6">
      {/* Drawing Tools */}
      <CollapsibleSection title="Drawing Tools" defaultExpanded={false}>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              onSetDrawingMode('select');
              onSetTool('select');
            }}
            className={cn(
              "retro-button flex items-center justify-center p-4 transition-colors text-center",
              drawingMode === 'select' 
                ? "bg-[var(--retro-accent)]" 
                : "hover:bg-[var(--retro-accent)]"
            )}
            title="Select Tool"
          >
            <MousePointer className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              onSetDrawingMode('pencil');
              onSetTool('pencil');
            }}
            className={cn(
              "retro-button flex items-center justify-center p-4 transition-colors text-center",
              drawingMode === 'pencil' 
                ? "bg-[var(--retro-accent)]" 
                : "hover:bg-[var(--retro-accent)]"
            )}
            title="Pencil Tool"
          >
            <Pencil className="w-5 h-5" />
          </button>
          <button
            onClick={handleAddText}
            className={cn(
              "retro-button flex items-center justify-center p-4 transition-colors text-center",
              drawingMode === 'text' 
                ? "bg-[var(--retro-accent)]" 
                : "hover:bg-[var(--retro-accent)]"
            )}
            title="Add Text"
          >
            <Type className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              console.log('Rectangle button clicked');
              onSetDrawingMode('rectangle');
              onSetTool('rectangle');
            }}
            className={cn(
              "retro-button flex items-center justify-center p-4 transition-colors text-center",
              drawingMode === 'rectangle' 
                ? "bg-[var(--retro-accent)]" 
                : "hover:bg-[var(--retro-accent)]"
            )}
            title="Draw Rectangle"
          >
            <Square className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => {
              console.log('Circle button clicked');
              onSetDrawingMode('circle');
              onSetTool('circle');
            }}
            className={cn(
              "retro-button flex items-center justify-center p-4 transition-colors text-center",
              drawingMode === 'circle' 
                ? "bg-[var(--retro-accent)]" 
                : "hover:bg-[var(--retro-accent)]"
            )}
            title="Draw Circle"
          >
            <Circle className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleImageClick}
            className="retro-button flex items-center justify-center p-4 transition-colors hover:bg-[var(--retro-accent)] text-center"
            title="Add Image"
          >
            <Image className="w-5 h-5" />
          </button>
        </div>
      </CollapsibleSection>

      {/* AI Tools */}
      {(onAIText || onAIImage) && (
        <CollapsibleSection title="AI Tools" defaultExpanded={false}>
          <div className="space-y-4">
            {onAIText && (
              <button
                onClick={onAIText}
                className="retro-button w-full flex items-center justify-center space-x-3 p-4 transition-colors hover:bg-[var(--retro-accent)] text-center"
                title="AI Text Generation"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold text-center">AI Text</span>
              </button>
            )}
            
            {onAIImage && (
              <button
                onClick={onAIImage}
                className="retro-button w-full flex items-center justify-center space-x-3 p-4 transition-colors hover:bg-[var(--retro-accent)] text-center"
                title="AI Image Generation"
              >
                <Wand2 className="w-5 h-5" />
                <span className="text-sm font-bold text-center">AI Image</span>
              </button>
            )}
          </div>
        </CollapsibleSection>
      )}


      {/* Color Palette */}
      <CollapsibleSection title="Color Palette" defaultExpanded={false}>
        <div className="space-y-3">
          {/* Row 1: Primary Colors */}
          <div className="grid grid-cols-5 gap-2">
            {colors.slice(0, 10).map((color) => (
              <button
                key={color}
                onClick={() => onSetBackgroundColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform shadow-sm",
                  canvas?.backgroundColor === color ? "border-[var(--retro-accent)] ring-2 ring-[var(--retro-accent)]" : "border-gray-600"
                )}
                style={{ 
                  backgroundColor: color,
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                title={color}
              />
            ))}
          </div>
          
          {/* Row 2: Secondary Colors */}
          <div className="grid grid-cols-5 gap-2">
            {colors.slice(10, 20).map((color) => (
              <button
                key={color}
                onClick={() => onSetBackgroundColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform shadow-sm",
                  canvas?.backgroundColor === color ? "border-[var(--retro-accent)] ring-2 ring-[var(--retro-accent)]" : "border-gray-600"
                )}
                style={{ 
                  backgroundColor: color,
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                title={color}
              />
            ))}
          </div>
          
          {/* Row 3: Vibrant Colors */}
          <div className="grid grid-cols-5 gap-2">
            {colors.slice(20, 30).map((color) => (
              <button
                key={color}
                onClick={() => onSetBackgroundColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform shadow-sm",
                  canvas?.backgroundColor === color ? "border-[var(--retro-accent)] ring-2 ring-[var(--retro-accent)]" : "border-gray-600"
                )}
                style={{ 
                  backgroundColor: color,
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                title={color}
              />
            ))}
          </div>
          
          {/* Row 4: Pastel Colors */}
          <div className="grid grid-cols-5 gap-2">
            {colors.slice(30, 40).map((color) => (
              <button
                key={color}
                onClick={() => onSetBackgroundColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform shadow-sm",
                  canvas?.backgroundColor === color ? "border-[var(--retro-accent)] ring-2 ring-[var(--retro-accent)]" : "border-gray-600"
                )}
                style={{ 
                  backgroundColor: color,
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                title={color}
              />
            ))}
          </div>
          
          {/* Row 5: Dark Colors */}
          <div className="grid grid-cols-5 gap-2">
            {colors.slice(40, 50).map((color) => (
              <button
                key={color}
                onClick={() => onSetBackgroundColor(color)}
                className={cn(
                  "w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform shadow-sm",
                  canvas?.backgroundColor === color ? "border-[var(--retro-accent)] ring-2 ring-[var(--retro-accent)]" : "border-gray-600"
                )}
                style={{ 
                  backgroundColor: color,
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Zoom Controls */}
      <CollapsibleSection title="Zoom" defaultExpanded={false}>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleZoomOut}
              className="retro-button p-3 hover:bg-[var(--retro-accent)] text-center"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <div className="flex-1 text-center">
              <span className="text-lg text-[var(--retro-text)] font-bold text-center">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            
            <button
              onClick={handleZoomIn}
              className="retro-button p-3 hover:bg-[var(--retro-accent)] text-center"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
          
          <button
            onClick={() => onSetZoom(1)}
            className="retro-button w-full flex items-center justify-center space-x-3 p-4 hover:bg-[var(--retro-accent)] text-center"
            title="Reset Zoom to 100%"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-bold text-center">Reset Zoom</span>
          </button>
        </div>
      </CollapsibleSection>

      {/* Storage Actions */}
      <CollapsibleSection title="Storage" defaultExpanded={false}>
        <div className="space-y-4">
          <button
            onClick={onSave}
            disabled={!isWalletConnected}
            className={cn(
              "retro-button w-full flex items-center justify-center space-x-3 p-4 transition-colors text-center",
              isWalletConnected
                ? "hover:bg-[var(--retro-accent)]"
                : "opacity-50 cursor-not-allowed"
            )}
            title={!isWalletConnected ? "Connect wallet to save/load designs" : "Save/Load design to/from Walrus"}
          >
            <Save className="w-5 h-5" />
            <span className="text-sm font-bold text-center">
              {isWalletConnected ? "Save/Load" : "Connect Wallet to Save/Load"}
            </span>
          </button>
        </div>
      </CollapsibleSection>

      

      {/* Actions */}
      <CollapsibleSection title="Actions" defaultExpanded={false}>
        <div className="space-y-4">
          <button
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSelected(); }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSelected(); }}
            className="retro-button w-full flex items-center justify-center space-x-3 p-4 transition-colors hover:bg-red-500 hover:text-white text-center"
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-bold text-center">Delete Selected</span>
          </button>
          
          <button
            onClick={onClearCanvas}
            className="retro-button w-full flex items-center justify-center space-x-3 p-4 transition-colors hover:bg-red-500 hover:text-white text-center"
          >
            <X className="w-5 h-5" />
            <span className="text-sm font-bold text-center">Clear Canvas</span>
          </button>
          
          <button
            onClick={handleExport}
            className="retro-button w-full flex items-center justify-center space-x-3 p-4 transition-colors hover:bg-[var(--retro-accent)] text-center"
          >
            <Download className="w-5 h-5" />
            <span className="text-sm font-bold text-center">Export PNG</span>
          </button>
        </div>
      </CollapsibleSection>

      {/* Image Modal */}
      {/* Managed by parent */}
      
      
    </div>
  );
}
