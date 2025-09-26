'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fabric } from '@/lib/fabric';
import { Download, Upload, Save, Settings, Image, Link } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { updateTextFontFamily, AVAILABLE_FONTS, initializeFonts } from '@/utils/fontLoader';
import AITextModal from '../AI/AITextModal';
import AIImageModal from '../AI/AIImageModal';

interface PropertyPanelProps {
  canvas: fabric.Canvas | null;
  selectedObjects: fabric.Object[];
  onExport?: (format: 'json' | 'svg' | 'png') => any;
  onAddImage?: (url: string) => void;
  selectedTool?: 'select' | 'text' | 'rectangle' | 'circle' | 'image';
  activeAIPanel?: 'text' | 'image' | null;
  onCloseAIPanel?: () => void;
}

export default function PropertyPanel({ 
  canvas, 
  selectedObjects, 
  onExport,
  onAddImage,
  selectedTool = 'select',
  activeAIPanel = null,
  onCloseAIPanel
}: PropertyPanelProps) {
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [properties, setProperties] = useState({
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 1,
    opacity: 1,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    // Text-specific properties
    fontSize: 20,
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    lineHeight: 1,
    charSpacing: 0,
  });

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedObjects.length === 1) {
      const obj = selectedObjects[0];
      setSelectedObject(obj);
      setProperties({
        fill: (obj.fill as string) || '#000000',
        stroke: (obj.stroke as string) || '#000000',
        strokeWidth: obj.strokeWidth || 1,
        opacity: obj.opacity || 1,
        angle: obj.angle || 0,
        scaleX: obj.scaleX || 1,
        scaleY: obj.scaleY || 1,
        left: obj.left || 0,
        top: obj.top || 0,
        width: obj.width || 0,
        height: obj.height || 0,
        // Text-specific properties
        fontSize: (obj as any).fontSize || 20,
        fontFamily: (obj as any).fontFamily || 'Arial',
        fontWeight: (obj as any).fontWeight || 'normal',
        fontStyle: (obj as any).fontStyle || 'normal',
        textAlign: (obj as any).textAlign || 'left',
        lineHeight: (obj as any).lineHeight || 1,
        charSpacing: (obj as any).charSpacing || 0,
      });
    } else {
      setSelectedObject(null);
    }
  }, [selectedObjects]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Debounced update function for properties that need smooth updates
  const debouncedUpdateProperty = useCallback((key: string, value: any) => {
    if (!selectedObject || !canvas) {
      console.log('No selected object or canvas available');
      return;
    }

    console.log(`Debounced update: ${key} = ${value}`);
    console.log('Canvas objects before update:', canvas.getObjects().length);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      console.log('Executing debounced update for:', key, value);
      // For text objects, handle specific properties that need special treatment
      if (selectedObject.type === 'text' || selectedObject.type === 'textbox') {
        const textObj = selectedObject as fabric.Textbox;
        
        // Handle font-related properties that need special handling
        if (key === 'fontSize' || key === 'fontFamily' || key === 'fontWeight' || key === 'fontStyle') {
          // For text objects, we need to update the text properties properly
          console.log(`Updating ${key} to:`, value);
          
          // Special handling for font size changes - update originalFontSize for scaling
          if (key === 'fontSize') {
            textObj.set({
              fontSize: value,
              ...({ originalFontSize: value } as any)
            });
          }
          // Special handling for font family changes
          else if (key === 'fontFamily') {
            // Clear fabric font cache to prevent rendering issues
            if (typeof fabric !== 'undefined' && fabric.util && fabric.util.clearFabricFontCache) {
              fabric.util.clearFabricFontCache();
            }
            
            try {
              textObj.set('fontFamily', value);
            } catch (error) {
              console.error('Error updating font family:', error);
              textObj.set('fontFamily', 'Arial');
            }
            
            textObj.setCoords();
            if (textObj.initDimensions) {
              textObj.initDimensions();
            }
            textObj.dirty = true;
            
            canvas.renderAll();
            return;
          } else {
            textObj.set({
              [key]: value
            });
          }
          
          // Force text to recalculate its dimensions and coordinates
          if (key === 'fontSize') {
            textObj.setCoords();
            if (textObj.initDimensions) {
              textObj.initDimensions();
            }
            textObj.dirty = true;
          }
        } else if (key === 'textAlign') {
          textObj.set('textAlign', value);
        } else if (key === 'width' || key === 'height') {
          // For textbox dimensions, use proper scaling
          textObj.set({
            [key]: value
          });
          textObj.setCoords();
        } else {
          // For other properties, use standard set method
          (textObj as any).set(key, value);
        }
      } else {
        // For non-text objects, use standard property update
        (selectedObject as any).set(key, value);
      }
      
      // Ensure the object is properly updated and rendered
      selectedObject.setCoords();
      canvas.renderAll();
      
      console.log('Canvas objects after update:', canvas.getObjects().length);
      console.log('Selected object after update:', selectedObject);
    }, 150); // 150ms debounce delay
  }, [selectedObject, canvas]);

  // Immediate update function for properties that need instant updates
  const updateProperty = (key: string, value: any) => {
    if (!selectedObject || !canvas) return;

    setProperties(prev => ({ ...prev, [key]: value }));
    
      // For immediate updates (like color changes, alignment buttons)
      if (key === 'fill' || key === 'stroke' || key === 'textAlign' || key === 'fontWeight' || key === 'fontStyle' || key === 'fontSize') {
        // For text objects, handle specific properties that need special treatment
        if (selectedObject.type === 'text' || selectedObject.type === 'textbox') {
          const textObj = selectedObject as fabric.Textbox;
          
          if (key === 'textAlign') {
            textObj.set('textAlign', value);
          } else if (key === 'fontWeight' || key === 'fontStyle') {
            textObj.set({
              [key]: value
            });
          } else if (key === 'fontSize') {
            // Update font size and originalFontSize for scaling
            textObj.set({
              fontSize: value,
              ...({ originalFontSize: value } as any)
            });
          } else {
            (textObj as any).set(key, value);
          }
        } else {
          (selectedObject as any).set(key, value);
        }
        
        selectedObject.setCoords();
        canvas.renderAll();
      } else if (key === 'fontFamily') {
        // Font family changes should always be debounced for proper handling
        debouncedUpdateProperty(key, value);
      } else {
        // For properties that can be debounced (like fontSize, dimensions)
        debouncedUpdateProperty(key, value);
      }
  };

  const handleExport = (format: 'json' | 'svg' | 'png') => {
    if (!canvas || !onExport) return;
    
    const data = onExport(format);
    
    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `walrus-canvas-design.${format}`;
      link.href = data;
      link.click();
    } else {
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `walrus-canvas-design.${format}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        canvas.loadFromJSON(data, () => {
          canvas.renderAll();
        });
      } catch (error) {
        console.error('Failed to load design:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddImage) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size too large. Please select an image smaller than 10MB.');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
      }
      
      setIsUploading(true);
      const url = URL.createObjectURL(file);
      onAddImage(url);
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl && onAddImage) {
      onAddImage(imageUrl);
      setImageUrl('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSubmit();
    }
  };

  // Debug function to check canvas state
  const debugCanvasState = () => {
    if (!canvas) return;
    console.log('=== CANVAS DEBUG INFO ===');
    console.log('Total objects:', canvas.getObjects().length);
    console.log('Selected objects:', selectedObjects.length);
    console.log('Canvas size:', canvas.getWidth(), 'x', canvas.getHeight());
    console.log('Canvas zoom:', canvas.getZoom());
    console.log('All objects:', canvas.getObjects().map(obj => ({
      type: obj.type,
      id: (obj as any).id || 'no-id',
      visible: obj.visible,
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height
    })));
    console.log('========================');
  };

  // Function to ensure all objects are visible
  const ensureObjectsVisible = () => {
    if (!canvas) return;

    canvas.getObjects().forEach(obj => {
      if ((obj as any).__deleted) {
        return;
      }

      if (!obj.visible) {
        obj.set('visible', true);
      }

      if (obj.opacity === 0) {
        obj.set('opacity', 1);
      }

      obj.setCoords();
      obj.dirty = true;
    });

    canvas.renderAll();
  };

  return (
    <div className="h-full flex flex-col w-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {/* Show AI panels when active */}
        {activeAIPanel === 'text' ? (
          <div className="h-full w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">AI Text Generation</h2>
              <button
                onClick={onCloseAIPanel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full w-full overflow-hidden">
              <AITextModal 
                isOpen={true}
                onClose={onCloseAIPanel || (() => {})}
                canvas={canvas}
                embedded={true}
              />
            </div>
          </div>
        ) : activeAIPanel === 'image' ? (
          <div className="h-full w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">AI Image Generation</h2>
              <button
                onClick={onCloseAIPanel}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="h-full w-full overflow-hidden">
              <AIImageModal 
                isOpen={true}
                onClose={onCloseAIPanel || (() => {})}
                canvas={canvas}
                embedded={true}
              />
            </div>
          </div>
        ) : selectedTool === 'image' ? (
          /* Image Upload Section */
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add Image</h3>
            <div className="space-y-4">
              {/* Local File Upload */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Upload from Computer</label>
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <div className={cn(
                    "flex items-center justify-center space-x-2 p-3 text-sm bg-gray-50 text-gray-600 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-medium">
                      {isUploading ? 'Uploading...' : 'Choose Image File'}
                    </span>
                  </div>
                </label>
                <p className="text-xs text-gray-500 text-center">
                  Supports JPG, PNG, GIF, WebP (max 10MB)
                </p>
              </div>
              
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-2 text-xs text-gray-500">or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              {/* URL Input */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-600">Add from URL</label>
                <div className="space-y-2">
                  <div className="relative">
                    <Link className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="url"
                      placeholder="Enter image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-7 pr-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!imageUrl}
                    className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Add Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Default content for other tools */
          <>
            {/* Export/Import */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Export/Import</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleExport('png')}
                    className="flex items-center justify-center space-x-1 p-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                  >
                    <Download className="w-4 h-4" />
                    <span>PNG</span>
                  </button>
                  <button
                    onClick={() => handleExport('svg')}
                    className="flex items-center justify-center space-x-1 p-2 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100"
                  >
                    <Download className="w-4 h-4" />
                    <span>SVG</span>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center justify-center space-x-1 p-2 text-sm bg-purple-50 text-purple-600 rounded hover:bg-purple-100"
                  >
                    <Download className="w-4 h-4" />
                    <span>JSON</span>
                  </button>
                </div>
                
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center space-x-1 p-2 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Import JSON</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Object Properties */}
            {selectedObject ? (
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Object Properties</h3>
            
            {/* Text Properties - Only show for text objects */}
            {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-xs font-medium text-blue-800">Text Properties</h4>
                
                {/* Font Family */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                  <select
                    value={properties.fontFamily}
                    onChange={(e) => {
                      console.log('Font family change requested:', e.target.value);
                      updateProperty('fontFamily', e.target.value);
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {AVAILABLE_FONTS.map((font) => (
                      <option key={font.name} value={font.name}>
                        {font.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                  <input
                    type="number"
                    min="8"
                    max="200"
                    value={properties.fontSize}
                    onChange={(e) => {
                      const value = Math.max(8, Math.min(200, Number(e.target.value) || 8));
                      updateProperty('fontSize', value);
                    }}
                    onBlur={(e) => {
                      const value = Math.max(8, Math.min(200, Number(e.target.value) || 8));
                      setProperties(prev => ({ ...prev, fontSize: value }));
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Font Weight & Style */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Weight</label>
                    <select
                      value={properties.fontWeight}
                      onChange={(e) => updateProperty('fontWeight', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Style</label>
                    <select
                      value={properties.fontStyle}
                      onChange={(e) => updateProperty('fontStyle', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>

                {/* Text Alignment */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
                  <div className="flex space-x-1">
                    {['left', 'center', 'right'].map((align) => (
                      <button
                        key={align}
                        onClick={() => updateProperty('textAlign', align)}
                        className={`flex-1 px-2 py-1 text-xs rounded ${
                          properties.textAlign === align
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textbox Size - Only for textbox objects */}
                {selectedObject.type === 'textbox' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                      <input
                        type="number"
                        min="50"
                        max="1000"
                        value={Math.round(properties.width)}
                        onChange={(e) => {
                          const value = Math.max(50, Math.min(1000, Number(e.target.value) || 50));
                          updateProperty('width', value);
                        }}
                        onBlur={(e) => {
                          const value = Math.max(50, Math.min(1000, Number(e.target.value) || 50));
                          setProperties(prev => ({ ...prev, width: value }));
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                      <input
                        type="number"
                        min="20"
                        max="500"
                        value={Math.round(properties.height)}
                        onChange={(e) => {
                          const value = Math.max(20, Math.min(500, Number(e.target.value) || 20));
                          updateProperty('height', value);
                        }}
                        onBlur={(e) => {
                          const value = Math.max(20, Math.min(500, Number(e.target.value) || 20));
                          setProperties(prev => ({ ...prev, height: value }));
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Fill Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fill Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={properties.fill}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={properties.fill}
                  onChange={(e) => updateProperty('fill', e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stroke Color */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={properties.stroke}
                  onChange={(e) => updateProperty('stroke', e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={properties.stroke}
                  onChange={(e) => updateProperty('stroke', e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Stroke Width */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Width</label>
              <input
                type="number"
                min="0"
                max="20"
                value={properties.strokeWidth}
                onChange={(e) => updateProperty('strokeWidth', Number(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={properties.opacity}
                onChange={(e) => updateProperty('opacity', Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{Math.round(properties.opacity * 100)}%</div>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">X</label>
                <input
                  type="number"
                  value={Math.round(properties.left)}
                  onChange={(e) => updateProperty('left', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Y</label>
                <input
                  type="number"
                  value={Math.round(properties.top)}
                  onChange={(e) => updateProperty('top', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Scale */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Scale X</label>
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={properties.scaleX}
                  onChange={(e) => updateProperty('scaleX', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Scale Y</label>
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={properties.scaleY}
                  onChange={(e) => updateProperty('scaleY', Number(e.target.value))}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Rotation</label>
              <input
                type="range"
                min="-180"
                max="180"
                value={properties.angle}
                onChange={(e) => updateProperty('angle', Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">{Math.round(properties.angle)}°</div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select an object to edit properties</p>
          </div>
        )}

        {/* Canvas Info */}
        <div className="p-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Canvas Info</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Objects: {canvas?.getObjects().length || 0}</div>
            <div>Selected: {selectedObjects.length}</div>
            <div>Size: {canvas?.getWidth()} × {canvas?.getHeight()}</div>
          </div>
          <div className="mt-2 space-y-1">
            <button
              onClick={debugCanvasState}
              className="w-full px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
            >
              Debug Canvas State
            </button>
            <button
              onClick={ensureObjectsVisible}
              className="w-full px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
            >
              Force Objects Visible
            </button>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
