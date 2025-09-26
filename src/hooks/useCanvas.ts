import { useState, useRef, useCallback, useEffect } from 'react';
import { fabric } from '@/lib/fabric';
import { CANVAS_CONFIG } from '@/utils/constants';

export type DrawingMode = 'select' | 'rectangle' | 'circle' | 'text' | null;

export interface CanvasState {
  canvas: fabric.Canvas | null;
  isReady: boolean;
  selectedObjects: fabric.Object[];
  zoom: number;
  error: string | null;
  drawingMode: DrawingMode;
  isDrawing: boolean;
  startPoint: { x: number; y: number } | null;
  currentShape: fabric.Object | null;
}

export function useCanvas(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<CanvasState>({
    canvas: null,
    isReady: false,
    selectedObjects: [],
    zoom: 1,
    error: null,
    drawingMode: 'select',
    isDrawing: false,
    startPoint: null,
    currentShape: null,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const lastSelectedRef = useRef<fabric.Object[]>([]);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  
  // Keep state ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const initializeCanvas = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    try {
      // Prevent creating multiple Fabric instances for the same <canvas>
      if (fabricCanvasRef.current) {
        console.warn('Fabric canvas already initialized, skipping re-initialization');
        return;
      }

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: CANVAS_CONFIG.DEFAULT_WIDTH,
        height: CANVAS_CONFIG.DEFAULT_HEIGHT,
        backgroundColor: CANVAS_CONFIG.BACKGROUND_COLOR,
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true, // Keep true for proper object rendering
        skipTargetFind: false,
        skipOffscreen: false,
        enableRetinaScaling: true,
        imageSmoothingEnabled: true,
      });

      // Keep a direct ref for proper cleanup even if state closure changes
      fabricCanvasRef.current = canvas;

      // Set up event listeners
      canvas.on('selection:created', (e) => {
        console.log('Selection created:', e.selected?.length || 0, 'objects');
        setState(prev => ({
          ...prev,
          selectedObjects: e.selected || []
        }));
        lastSelectedRef.current = e.selected ? [...e.selected] : [];
      });

      canvas.on('selection:updated', (e) => {
        console.log('Selection updated:', e.selected?.length || 0, 'objects');
        setState(prev => ({
          ...prev,
          selectedObjects: e.selected || []
        }));
        lastSelectedRef.current = e.selected ? [...e.selected] : [];
      });

      canvas.on('selection:cleared', (e) => {
        console.log('Selection cleared');
        // Ignore synthetic selection clear that immediately follows deletion
        const anyTarget = (e as any)?.deselected?.[0] || canvas.getActiveObject();
        if (anyTarget && (anyTarget as any).__deleted) {
          console.log('Ignoring selection:cleared caused by deletion');
          lastSelectedRef.current = [];
          setState(prev => ({ ...prev, selectedObjects: [] }));
          return;
        }

        // Fallback: if deselected textboxes are empty, remove them
        const deselected = (e as any)?.deselected as fabric.Object[] | undefined;
        if (Array.isArray(deselected) && deselected.length > 0) {
          let removedAny = false;
          deselected.forEach(obj => {
            if (obj && obj.type === 'textbox') {
              const tb = obj as fabric.Textbox;
              const text = tb.text?.trim() || '';
              if (text === '' && !(tb as any).__deleted) {
                (tb as any).__deleted = true;
                console.log('Deleting empty text box on deselect');
                canvas.remove(tb);
                removedAny = true;
              }
            }
          });
          if (removedAny) {
            canvas.discardActiveObject();
            canvas.requestRenderAll();
          }
        }

        setState(prev => ({
          ...prev,
          selectedObjects: []
        }));
        lastSelectedRef.current = [];
      });

      // Add debugging for object changes
      canvas.on('object:added', (e) => {
        console.log('Object added:', e.target?.type, 'Total objects:', canvas.getObjects().length);
      });

      canvas.on('object:removed', (e) => {
        console.log('Object removed:', e.target?.type, 'Total objects:', canvas.getObjects().length);
        // If removal was due to delete, make sure selection state is empty
        if ((e.target as any)?.__deleted) {
          setState(prev => ({ ...prev, selectedObjects: [] }));
        }
      });

      canvas.on('object:modified', (e) => {
        console.log('Object modified:', e.target?.type, 'Total objects:', canvas.getObjects().length);
      });

      // Handle text editing completion - delete empty text boxes
      canvas.on('text:editing:exited', (e) => {
        const textObject = e.target as fabric.Textbox;
        if (textObject && textObject.type === 'textbox') {
          const text = textObject.text?.trim() || '';
          if (text === '') {
            (textObject as any).__deleted = true;
            console.log('Deleting empty text box on editing exit');
            canvas.remove(textObject);
            canvas.discardActiveObject();
            canvas.requestRenderAll();
          }
        }
      });

      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        
        // Get the pointer position relative to the canvas
        const pointer = canvas.getPointer(opt.e, true);
        canvas.zoomToPoint(pointer, zoom);
        setState(prev => ({ ...prev, zoom }));
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      // Drawing mode mouse events - Following Fabric.js best practices
      canvas.on('mouse:down', (opt) => {
        const currentState = stateRef.current;
        console.log('Mouse down - drawing mode:', currentState.drawingMode);
        
        // If we're in select mode or clicking on an existing object, don't create new shapes
        if (currentState.drawingMode === 'select' || opt.target) {
          console.log('In select mode or clicked on existing object, not creating new shape');
          return;
        }
        
        // Disable selection visuals while drawing shapes
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.renderAll();

        // Use the correct pointer calculation method
        const pointer = canvas.getPointer(opt.e, true);
        console.log('Starting to draw at:', pointer);
        
        let newShape: fabric.Object;
        
        if (currentState.drawingMode === 'rectangle') {
          newShape = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: '#007bff',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          });
        } else if (currentState.drawingMode === 'circle') {
          newShape = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            originX: 'center',
            originY: 'center',
            radius: 0,
            fill: 'transparent',
            stroke: '#007bff',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          });
        } else if (currentState.drawingMode === 'text') {
          // Create a textbox that can be resized by dragging
          newShape = new fabric.Textbox('', {
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fontSize: 20,
            fill: 'transparent',
            fontFamily: 'Arial',
            selectable: false,
            evented: false,
            textAlign: 'left',
            splitByGrapheme: true,
            // Enable resizing
            lockUniScaling: false,
            cornerSize: 8,
            cornerStyle: 'circle',
            cornerColor: '#007bff',
            transparentCorners: false,
            stroke: '#007bff',
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            // Store original font size for scaling calculations
            ...({ originalFontSize: 20 } as any)
          });
        } else {
          return;
        }
        
        canvas.add(newShape);
        
        setState(prev => ({
          ...prev,
          isDrawing: true,
          startPoint: { x: pointer.x, y: pointer.y },
          currentShape: newShape
        }));
      });

      canvas.on('mouse:move', (opt) => {
        const currentState = stateRef.current;
        if (!currentState.isDrawing || !currentState.currentShape || currentState.drawingMode === 'select') return;
        
        const pointer = canvas.getPointer(opt.e, true);
        const { x: startX, y: startY } = currentState.startPoint!;
        
        if (currentState.drawingMode === 'rectangle') {
          const rect = currentState.currentShape as fabric.Rect;
          if (pointer.x > startX) {
            rect.set({ width: pointer.x - startX });
          } else {
            rect.set({ left: pointer.x, width: startX - pointer.x });
          }
          if (pointer.y > startY) {
            rect.set({ height: pointer.y - startY });
          } else {
            rect.set({ top: pointer.y, height: startY - pointer.y });
          }
        } else if (currentState.drawingMode === 'circle') {
          const circle = currentState.currentShape as fabric.Circle;
          const dx = pointer.x - startX;
          const dy = pointer.y - startY;
          const radius = Math.sqrt(dx * dx + dy * dy) / 2;
          const cx = startX + dx / 2;
          const cy = startY + dy / 2;
          circle.set({
            radius: radius,
            left: cx,
            top: cy
          });
        } else if (currentState.drawingMode === 'text') {
          const textbox = currentState.currentShape as fabric.Textbox;
          // Calculate width and height based on drag distance
          const width = Math.abs(pointer.x - startX);
          const height = Math.abs(pointer.y - startY);
          
          // Set minimum size
          const minWidth = 50;
          const minHeight = 20;
          const finalWidth = Math.max(width, minWidth);
          const finalHeight = Math.max(height, minHeight);
          
          // Calculate font size based on text box dimensions (MS Paint style)
          // Use a more direct relationship: font size should be about 70-80% of text box height
          const newFontSize = Math.max(8, Math.min(200, finalHeight * 0.75));
          
          textbox.set({
            left: startX,
            top: startY,
            width: finalWidth,
            height: finalHeight,
            fontSize: newFontSize
          });
        }
        
        canvas.renderAll();
      });

      canvas.on('mouse:up', (opt) => {
        const currentState = stateRef.current;
        if (!currentState.isDrawing || !currentState.currentShape || currentState.drawingMode === 'select') return;
        
        const pointer = canvas.getPointer(opt.e, true);
        const { x: startX, y: startY } = currentState.startPoint!;
        
        // Check minimum size
        let hasMinimumSize = false;
        if (currentState.drawingMode === 'rectangle') {
          const width = Math.abs(pointer.x - startX);
          const height = Math.abs(pointer.y - startY);
          hasMinimumSize = width > 5 && height > 5;
        } else if (currentState.drawingMode === 'circle') {
          const diameter = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2));
          hasMinimumSize = diameter > 10; // Minimum diameter of 10 pixels
        } else if (currentState.drawingMode === 'text') {
          const width = Math.abs(pointer.x - startX);
          const height = Math.abs(pointer.y - startY);
          hasMinimumSize = width > 50 && height > 20; // Minimum size for text
        }
        
        if (hasMinimumSize) {
          // Finalize the shape
          const shape = currentState.currentShape;
          if (currentState.drawingMode === 'rectangle') {
            shape.set({
              fill: '#ff0000',
              stroke: '#000000',
              strokeWidth: 1,
              strokeDashArray: undefined,
              selectable: true,
              evented: true
            });
          } else if (currentState.drawingMode === 'circle') {
            shape.set({
              fill: '#00ff00',
              stroke: '#000000',
              strokeWidth: 1,
              strokeDashArray: undefined,
              selectable: true,
              evented: true
            });
          } else if (currentState.drawingMode === 'text') {
            const textbox = shape as fabric.Textbox;
            
            // Calculate final font size based on text box dimensions
            const width = textbox.width || 50;
            const height = textbox.height || 20;
            // Use a more direct relationship: font size should be about 70-80% of text box height
            const finalFontSize = Math.max(8, Math.min(200, height * 0.75));
            
            textbox.set({
              text: '',
              fill: '#000000',
              stroke: undefined,
              strokeWidth: 0,
              strokeDashArray: undefined,
              selectable: true,
              evented: true,
              fontSize: finalFontSize,
              // Store the final font size as original for future scaling
              ...({ originalFontSize: finalFontSize } as any)
            });
            
            // Add scaling event listener for dynamic font sizing after creation
            textbox.on('scaling', (e) => {
              const textObj = e.target as fabric.Textbox;
              const scaleX = textObj.scaleX || 1;
              const scaleY = textObj.scaleY || 1;
              
              // Calculate new font size based on the new dimensions
              const newWidth = textObj.width! * scaleX;
              const newHeight = textObj.height! * scaleY;
              // Use a more direct relationship: font size should be about 70-80% of text box height
              const newFontSize = Math.max(8, Math.min(200, newHeight * 0.75));
              
              // Update font size and reset scale
              textObj.set({
                fontSize: newFontSize,
                scaleX: 1,
                scaleY: 1,
                width: textObj.width! * scaleX,
                height: textObj.height! * scaleY
              });
              
              // Recalculate dimensions
              textObj.setCoords();
              if (textObj.initDimensions) {
                textObj.initDimensions();
              }
              
              canvas.renderAll();
            });
            
            // Enter editing mode after a short delay
            setTimeout(() => {
              textbox.enterEditing();
              canvas.renderAll();
            }, 100);
          }
          
          shape.setCoords();
          canvas.setActiveObject(shape);
        } else {
          // Remove shape if too small
          canvas.remove(currentState.currentShape);
        }
        
        canvas.renderAll();
        
        // Reset drawing state
        resetDrawingState();

        // Re-enable selection after finishing drawing
        canvas.selection = true;
        canvas.renderAll();
      });

      setState(prev => ({
        ...prev,
        canvas,
        isReady: true,
        error: null
      }));

      console.log('Canvas initialized successfully');

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Canvas initialization failed'
      }));
    }
  }, [containerRef]);

  const addText = useCallback((text: string, options?: any) => {
    if (!state.canvas) return;

    const textObject = new fabric.Textbox(text, {
      left: 100,
      top: 100,
      width: 200,
      height: 50,
      fontSize: 20,
      fill: '#000000',
      fontFamily: 'Arial',
      textAlign: 'left',
      splitByGrapheme: true,
      lockUniScaling: false,
      cornerSize: 8,
      cornerStyle: 'circle',
      cornerColor: '#007bff',
      transparentCorners: false,
      ...({ originalFontSize: 20 } as any),
      ...options
    });

    // Add scaling event listener for dynamic font sizing
    textObject.on('scaling', (e) => {
      const textObj = e.target as fabric.Textbox;
      const scaleX = textObj.scaleX || 1;
      const scaleY = textObj.scaleY || 1;
      
      // Calculate new font size based on the new dimensions
      const newWidth = textObj.width! * scaleX;
      const newHeight = textObj.height! * scaleY;
      // Use a more direct relationship: font size should be about 70-80% of text box height
      const newFontSize = Math.max(8, Math.min(200, newHeight * 0.75));
      
      // Update font size and reset scale
      textObj.set({
        fontSize: newFontSize,
        scaleX: 1,
        scaleY: 1,
        width: textObj.width! * scaleX,
        height: textObj.height! * scaleY
      });
      
      // Recalculate dimensions
      textObj.setCoords();
      if (textObj.initDimensions) {
        textObj.initDimensions();
      }
      
      state.canvas!.renderAll();
    });

    state.canvas.add(textObject);
    state.canvas.setActiveObject(textObject);
    state.canvas.renderAll();
  }, [state.canvas]);

  const addRectangle = useCallback((options?: any) => {
    if (!state.canvas) {
      console.log('Canvas not ready for addRectangle');
      return;
    }

    console.log('Adding rectangle via addRectangle function');
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 100,
      fill: '#ff0000',
      ...options
    });

    state.canvas.add(rect);
    state.canvas.setActiveObject(rect);
    state.canvas.renderAll();
  }, [state.canvas]);

  const addCircle = useCallback((options?: any) => {
    if (!state.canvas) return;

    const circle = new fabric.Circle({
      left: 100,
      top: 100,
      radius: 50,
      fill: '#00ff00',
      ...options
    });

    state.canvas.add(circle);
    state.canvas.setActiveObject(circle);
    state.canvas.renderAll();
  }, [state.canvas]);

  const addImage = useCallback((url: string, options?: any) => {
    if (!state.canvas) return;

    // Set drawing mode to select to prevent interference
    setState(prev => ({
      ...prev,
      drawingMode: 'select'
    }));

    fabric.Image.fromURL(url, (img: fabric.Image) => {
      // Get canvas dimensions and current zoom
      const canvasWidth = state.canvas!.getWidth();
      const canvasHeight = state.canvas!.getHeight();
      const currentZoom = state.canvas!.getZoom();
      
      // Calculate maximum size based on canvas size and zoom
      const maxWidth = Math.min(canvasWidth * 0.6, 400); // 60% of canvas width or max 400px
      const maxHeight = Math.min(canvasHeight * 0.6, 300); // 60% of canvas height or max 300px
      
      // Get original image dimensions
      const originalWidth = img.width || 1;
      const originalHeight = img.height || 1;
      const aspectRatio = originalWidth / originalHeight;
      
      // Calculate new dimensions while preserving aspect ratio
      let newWidth = maxWidth;
      let newHeight = maxWidth / aspectRatio;
      
      // If height exceeds max height, scale down based on height
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
      }
      
      // Center the image on canvas
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      
      img.set({
        left: centerX - (newWidth / 2),
        top: centerY - (newHeight / 2),
        scaleX: newWidth / originalWidth,
        scaleY: newHeight / originalHeight,
        selectable: true,
        evented: true,
        // Add corner controls for resizing
        cornerSize: 8,
        cornerStyle: 'circle',
        cornerColor: '#007bff',
        transparentCorners: false,
        lockUniScaling: false,
        ...options
      });
      
      state.canvas!.add(img);
      state.canvas!.setActiveObject(img);
      state.canvas!.requestRenderAll();
      
      // Ensure we're in select mode after adding image
      setState(prev => ({
        ...prev,
        drawingMode: 'select'
      }));
    }, {
      crossOrigin: 'anonymous' // Handle CORS for local images
    });
  }, [state.canvas]);

  const deleteSelected = useCallback(() => {
    if (!state.canvas) return;

    const canvasInstance = state.canvas;
    let targets: fabric.Object[] = canvasInstance.getActiveObjects();
    if (targets.length === 0 && state.selectedObjects.length > 0) {
      targets = [...state.selectedObjects];
    }
    if (targets.length === 0 && lastSelectedRef.current.length > 0) {
      targets = [...lastSelectedRef.current];
    }

    if (targets.length === 0) {
      console.log('deleteSelected called with no targets');
      return;
    }

    const handledObjects = new Set<fabric.Object>();

    targets.forEach(target => {
      if (!target || handledObjects.has(target)) {
        return;
      }

      handledObjects.add(target);
      (target as any).__deleted = true;

      if (target.type === 'activeSelection' && 'forEachObject' in target) {
        const selection = target as fabric.ActiveSelection;
        const children: fabric.Object[] = [];
        selection.forEachObject(obj => {
          children.push(obj);
        });

        // Remove children first to avoid them being re-added on selection changes
        children.forEach(child => {
          handledObjects.add(child);
          (child as any).__deleted = true;
          canvasInstance.remove(child);
        });
      }

      canvasInstance.remove(target);
    });

    // Important: discard selection AFTER removals to avoid Fabric re-grouping/refresh bringing them back
    canvasInstance.discardActiveObject();
    canvasInstance.requestRenderAll();

    lastSelectedRef.current = [];

    setState(prev => ({
      ...prev,
      selectedObjects: []
    }));
  }, [state.canvas, state.selectedObjects]);

  const clearCanvas = useCallback(() => {
    if (!state.canvas) return;

    state.canvas.clear();
    state.canvas.backgroundColor = CANVAS_CONFIG.BACKGROUND_COLOR;
    state.canvas.renderAll();
  }, [state.canvas]);

  const exportCanvas = useCallback((format: 'json' | 'svg' | 'png' = 'json') => {
    if (!state.canvas) return null;

    switch (format) {
      case 'json':
        return state.canvas.toJSON();
      case 'svg':
        return state.canvas.toSVG();
      case 'png':
        return state.canvas.toDataURL({ format: 'png' });
      default:
        return null;
    }
  }, [state.canvas]);

  const loadCanvas = useCallback((data: any) => {
    if (!state.canvas) return;

    state.canvas.loadFromJSON(data, () => {
      state.canvas!.renderAll();
    });
  }, [state.canvas]);

  const setBackgroundColor = useCallback((color: string) => {
    if (!state.canvas) return;

    state.canvas.backgroundColor = color;
    state.canvas.renderAll();
  }, [state.canvas]);

  const setZoom = useCallback((zoom: number) => {
    if (!state.canvas) return;

    state.canvas.setZoom(zoom);
    setState(prev => ({ ...prev, zoom }));
  }, [state.canvas]);

  const centerCanvas = useCallback(() => {
    if (!state.canvas) return;

    const canvasElement = state.canvas.getElement();
    const container = containerRef.current;
    if (!container) return;

    // Remove absolute positioning to fix coordinate issues
    canvasElement.style.position = 'relative';
    canvasElement.style.left = 'auto';
    canvasElement.style.top = 'auto';
    canvasElement.style.margin = '0 auto';
  }, [state.canvas, containerRef]);

  const resetDrawingState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawing: false,
      startPoint: null,
      currentShape: null
    }));
  }, []);

  const setDrawingMode = useCallback((mode: DrawingMode) => {
    console.log('Setting drawing mode to:', mode);
    
    // If we're currently drawing, cancel the current operation
    if (state.canvas && state.isDrawing && state.currentShape) {
      state.canvas.remove(state.currentShape);
      state.canvas.renderAll();
    }
    
    // Reset drawing state
    resetDrawingState();
    
    setState(prev => ({
      ...prev,
      drawingMode: mode
    }));
    
    // Update canvas cursor based on mode
    if (state.canvas) {
      const cursor = mode === 'select' ? 'default' : 'crosshair';
      state.canvas.defaultCursor = cursor;
      state.canvas.hoverCursor = cursor;
    }
  }, [state.canvas, state.isDrawing, state.currentShape, resetDrawingState]);

  useEffect(() => {
    initializeCanvas();

    return () => {
      const canvasInstance = fabricCanvasRef.current;
      if (canvasInstance) {
        // Clean up any ongoing drawing operations using latest state via ref
        const current = stateRef.current;
        if (current.isDrawing && current.currentShape) {
          try {
            canvasInstance.remove(current.currentShape);
          } catch {}
        }
        try {
          canvasInstance.dispose();
        } catch {}
      }
      fabricCanvasRef.current = null;
    };
  }, [initializeCanvas]);

  return {
    ...state,
    canvasRef,
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
    resetDrawingState,
  };
}
