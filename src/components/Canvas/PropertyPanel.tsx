'use client';

import React, { useState, useEffect } from 'react';
import { fabric } from '@/lib/fabric';
import { Download, Upload, Save, Settings } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface PropertyPanelProps {
  canvas: fabric.Canvas | null;
  selectedObjects: fabric.Object[];
  onExport?: (format: 'json' | 'svg' | 'png') => any;
}

export default function PropertyPanel({ 
  canvas, 
  selectedObjects, 
  onExport 
}: PropertyPanelProps) {
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
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

  const updateProperty = (key: string, value: any) => {
    if (!selectedObject || !canvas) return;

    setProperties(prev => ({ ...prev, [key]: value }));
    
    // Update the object
    (selectedObject as any)[key] = value;
    canvas.renderAll();
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
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
            {selectedObject.type === 'text' && (
              <div className="space-y-3 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-xs font-medium text-blue-800">Text Properties</h4>
                
                {/* Font Family */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
                  <select
                    value={properties.fontFamily}
                    onChange={(e) => updateProperty('fontFamily', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Impact">Impact</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
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
                    onChange={(e) => updateProperty('fontSize', Number(e.target.value))}
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
        </div>
      </div>
    </div>
  );
}
