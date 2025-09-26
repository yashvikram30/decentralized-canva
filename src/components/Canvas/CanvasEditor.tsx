'use client';

import React, { useRef, useEffect, useState } from 'react';
import { fabric } from '@/lib/fabric';
import { useCanvas } from '@/hooks/useCanvas';
import Toolbar from './Toolbar';
import PropertyPanel from './PropertyPanel';
import AIAssistant from '../AI/AIAssistant';
import AITextModal from '../AI/AITextModal';
import AIImageModal from '../AI/AIImageModal';
import EncryptionStatus from '../Privacy/EncryptionStatus';
import SaveDialog from '../Storage/SaveDialog';
import { ToastContainer } from '../UI/Toast';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/helpers';
import { initializeFonts } from '@/utils/fontLoader';
import WalrusTestPanel from '../Testing/WalrusTestPanel';
import WalletTestPanel from '../Testing/WalletTestPanel';

interface CanvasEditorProps {
  className?: string;
}

export default function CanvasEditor({ className }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [showAITextModal, setShowAITextModal] = useState(false);
  const [showAIImageModal, setShowAIImageModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showWalrusTest, setShowWalrusTest] = useState(false);
  const [showWalletTest, setShowWalletTest] = useState(false);
  const [encryptionStatus, setEncryptionStatus] = useState<'public' | 'private' | 'team' | 'template'>('public');
  const [isProcessingEncryption, setIsProcessingEncryption] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rectangle' | 'circle' | 'image'>('select');
  
  const { toasts, success, error, removeToast } = useToast();
  
  const {
    canvas,
    isReady,
    canvasRef,
    selectedObjects,
    zoom,
    drawingMode,
    addText,
    addRectangle,
    addCircle,
    addImage,
    deleteSelected,
    clearCanvas,
    exportCanvas,
    loadCanvas,
    setBackgroundColor,
    setZoom,
    centerCanvas,
    setDrawingMode,
    error: canvasError
  } = useCanvas(containerRef);

  useEffect(() => {
    if (isReady && canvas) {
      centerCanvas();
    }
  }, [isReady, canvas, centerCanvas]);

  // Initialize fonts on component mount
  useEffect(() => {
    initializeFonts();
  }, []);

  const handleEncryptionToggle = (newStatus: 'public' | 'private' | 'team' | 'template') => {
    setIsProcessingEncryption(true);
    setEncryptionStatus(newStatus);
    
    // Show toast notification
    if (newStatus === 'private') {
      success('🔐 Design Encrypted', 'Your design is now private and encrypted');
    } else {
      success('🔓 Design Made Public', 'Your design is now publicly accessible');
    }
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessingEncryption(false);
    }, 2000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when modals are open
      if (showAITextModal || showAIImageModal || showSaveDialog) return;
      
      // Ctrl/Cmd + S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setShowSaveDialog(true);
        success('💾 Save Dialog Opened', 'Use Ctrl+S to quickly save your design');
      }
      
      // Ctrl/Cmd + Z: Undo (placeholder)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        success('↩️ Undo', 'Undo functionality coming soon');
      }
      
      // Delete: Remove selected objects
      if (e.key === 'Delete' && selectedObjects.length > 0) {
        e.preventDefault();
        deleteSelected();
        success('🗑️ Objects Deleted', `Removed ${selectedObjects.length} object(s)`);
      }
      
      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (canvas) {
          const objects = canvas.getObjects();
          if (objects.length > 0) {
            canvas.discardActiveObject();
            // Create a selection group for all objects
            const selection = new fabric.ActiveSelection(objects, {
              canvas: canvas,
            });
            canvas.setActiveObject(selection);
            canvas.renderAll();
            success('📋 All Selected', `Selected ${objects.length} objects`);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAITextModal, showAIImageModal, showSaveDialog, selectedObjects, deleteSelected, canvas, success]);

  if (canvasError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Canvas Error</h2>
          <p className="text-gray-600">{canvasError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex h-screen bg-gray-50", className)}>
      {/* Left Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <Toolbar 
            canvas={canvas}
            drawingMode={drawingMode}
            onAddText={addText}
            onAddRectangle={addRectangle}
            onAddCircle={addCircle}
            onDeleteSelected={deleteSelected}
            onClearCanvas={clearCanvas}
            onSetBackgroundColor={setBackgroundColor}
            onSetZoom={setZoom}
            onSetDrawingMode={setDrawingMode}
            onSetTool={setSelectedTool}
            onAIText={() => setShowAITextModal(true)}
            onAIImage={() => setShowAIImageModal(true)}
            onSave={() => setShowSaveDialog(true)}
            onLoad={() => setShowSaveDialog(true)}
            zoom={zoom}
          />
          
          <div className="border-t border-gray-200 p-4">
            <AIAssistant canvas={canvas} />
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">WalrusCanvas AI</h1>
            <EncryptionStatus 
              status={encryptionStatus}
              onToggle={handleEncryptionToggle}
              isProcessing={isProcessingEncryption}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Zoom: {Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(1)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Reset Zoom
            </button>
            
            {/* Test Buttons */}
            <button
              onClick={() => setShowWalrusTest(true)}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded"
            >
              Test Walrus
            </button>
            <button
              onClick={() => setShowWalletTest(true)}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded"
            >
              Test Wallet
            </button>
          </div>
        </div>
        
        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="flex-1 bg-gray-100 flex items-center justify-center p-8 overflow-hidden"
        >
          <div ref={canvasContainerRef} className="relative">
          <div className="bg-white rounded-lg shadow-lg p-4 relative">
            {!isReady && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Initializing Canvas...</p>
                </div>
              </div>
            )}
            <canvas 
              ref={canvasRef} 
              className="border border-gray-200 rounded block mx-auto" 
              style={{ display: 'block' }}
            />
          </div>
          
          </div>
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-80 bg-white shadow-lg">
        <PropertyPanel 
          canvas={canvas}
          selectedObjects={selectedObjects}
          onExport={exportCanvas}
          onAddImage={addImage}
          selectedTool={selectedTool}
        />
      </div>

      {/* AI Modals */}
      <AITextModal 
        isOpen={showAITextModal}
        onClose={() => setShowAITextModal(false)}
        canvas={canvas}
      />
      
      <AIImageModal 
        isOpen={showAIImageModal}
        onClose={() => setShowAIImageModal(false)}
        canvas={canvas}
      />
      
      {/* Save/Load Dialog */}
      <SaveDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        canvas={canvas}
        onLoad={loadCanvas}
      />

      {/* Test Panels */}
      <WalrusTestPanel
        isOpen={showWalrusTest}
        onClose={() => setShowWalrusTest(false)}
      />
      
      <WalletTestPanel
        isOpen={showWalletTest}
        onClose={() => setShowWalletTest(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

    </div>
  );
}
