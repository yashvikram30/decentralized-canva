'use client';

import React, { useRef, useEffect, useState } from 'react';
import { fabric } from '@/lib/fabric';
import { useCanvas } from '@/hooks/useCanvas';
import Toolbar from './Toolbar';
import PropertyPanel from './PropertyPanel';
import AIImageModal from '../AI/AIImageModal';
import SaveDialog from '../Storage/SaveDialog';
import { ToastContainer } from '../UI/Toast';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/utils/helpers';
import { initializeFonts } from '@/utils/fontLoader';
import WalletStatus from '../Wallet/WalletStatus';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface CanvasEditorProps {
  className?: string;
}

export default function CanvasEditor({ className }: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const walrusActionRef = useRef<((action: 'save' | 'load') => void) | null>(null);
  // Removed AI Text modal usage
  const [showAIImageModal, setShowAIImageModal] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rectangle' | 'circle' | 'image' | 'pencil'>('select');
  const [activeAIPanel, setActiveAIPanel] = useState<'image' | null>(null);
  
  const { toasts, success, removeToast } = useToast();
  const currentAccount = useCurrentAccount();
  const isConnected = !!currentAccount;
  
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


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when modals are open
      if (showAIImageModal || showSaveDialog) return;
      
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
  }, [showAIImageModal, showSaveDialog, selectedObjects, deleteSelected, canvas, success]);

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
    <div className={cn("h-screen", className)}>
      {/* Top Bar - Full Width Header */}
      <div className="w-full header relative overflow-hidden p-4">
        <div className="relative px-24 py-6 flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-white">WalrusCanvas AI</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Wallet Status - Simplified */}
            <WalletStatus onConnect={() => {}} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="h-[calc(100vh-80px)] flex">
        {/* Left Sidebar */}
        <div className="sidebar flex-none" style={{ width: 272 }}>
          <div className="p-4 border-b-2 border-[var(--retro-border)]">
            <h2 className="text-lg font-bold text-[var(--retro-text)]">Tools</h2>
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
              onAIImage={() => setActiveAIPanel('image')}
              onSave={() => walrusActionRef.current?.('save')}
              onLoad={() => walrusActionRef.current?.('load')}
              zoom={zoom}
              isWalletConnected={isConnected}
            />
            
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="flex-1 flex items-center justify-center p-8 overflow-hidden"
          >
            <div ref={canvasContainerRef} className="relative">
            <div className="retro-panel p-4 relative">
              {!isReady && (
                <div className="absolute inset-0 bg-[var(--retro-bg)] bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--retro-accent)] mx-auto mb-2"></div>
                    <p className="text-sm text-[var(--retro-text)]">Initializing Canvas...</p>
                  </div>
                </div>
              )}
              <canvas 
                ref={canvasRef} 
                className="border-2 border-[var(--retro-border)] rounded block" 
                style={{ display: 'block' }}
              />
            </div>
            
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="sidebar flex-none" style={{ width: 320 }}>
          <PropertyPanel 
            canvas={canvas}
            selectedObjects={selectedObjects}
            onExport={exportCanvas}
            onAddImage={addImage}
            selectedTool={selectedTool}
            activeAIPanel={activeAIPanel}
            onCloseAIPanel={() => setActiveAIPanel(null)}
            onLoad={loadCanvas}
            onWalrusActionRef={walrusActionRef}
          />
        </div>
      </div>

      {/* AI Modals */}
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


      {/* Test Panels removed per request */}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

    </div>
  );
}
