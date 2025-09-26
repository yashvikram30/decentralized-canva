import { useState, useRef, useCallback, useEffect } from 'react';
import { fabric } from '@/lib/fabric';
import { CANVAS_CONFIG } from '@/utils/constants';

export type DrawingMode = 'select' | 'rectangle' | 'circle' | null;

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
  
  // Keep state ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const initializeCanvas = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;

    try {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: CANVAS_CONFIG.DEFAULT_WIDTH,
        height: CANVAS_CONFIG.DEFAULT_HEIGHT,
        backgroundColor: CANVAS_CONFIG.BACKGROUND_COLOR,
        selection: true,
        preserveObjectStacking: true,
      });

      // Set up event listeners
      canvas.on('selection:created', (e) => {
        setState(prev => ({
          ...prev,
          selectedObjects: e.selected || []
        }));
      });

      canvas.on('selection:updated', (e) => {
        setState(prev => ({
          ...prev,
          selectedObjects: e.selected || []
        }));
      });

      canvas.on('selection:cleared', () => {
        setState(prev => ({
          ...prev,
          selectedObjects: []
        }));
      });

      canvas.on('mouse:wheel', (opt) => {
        const delta = opt.e.deltaY;
        let zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        setState(prev => ({ ...prev, zoom }));
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      // Drawing mode mouse events
      canvas.on('mouse:down', (opt) => {
        const currentState = stateRef.current;
        console.log('Mouse down - drawing mode:', currentState.drawingMode);
        if (currentState.drawingMode === 'select') return;
        
        const pointer = canvas.getPointer(opt.e);
        console.log('Starting to draw at:', pointer);
        setState(prev => ({
          ...prev,
          isDrawing: true,
          startPoint: { x: pointer.x, y: pointer.y }
        }));
      });

      canvas.on('mouse:move', (opt) => {
        const currentState = stateRef.current;
        if (!currentState.isDrawing || !currentState.startPoint || currentState.drawingMode === 'select') return;
        
        const pointer = canvas.getPointer(opt.e);
        const { x: startX, y: startY } = currentState.startPoint;
        
        // Remove previous preview shape
        if (currentState.currentShape) {
          canvas.remove(currentState.currentShape);
        }
        
        let newShape: fabric.Object;
        
        if (currentState.drawingMode === 'rectangle') {
          const width = Math.abs(pointer.x - startX);
          const height = Math.abs(pointer.y - startY);
          const left = Math.min(startX, pointer.x);
          const top = Math.min(startY, pointer.y);
          
          newShape = new fabric.Rect({
            left,
            top,
            width,
            height,
            fill: 'transparent',
            stroke: '#007bff',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          });
        } else if (currentState.drawingMode === 'circle') {
          const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2));
          
          newShape = new fabric.Circle({
            left: startX - radius,
            top: startY - radius,
            radius,
            fill: 'transparent',
            stroke: '#007bff',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false
          });
        } else {
          return;
        }
        
        canvas.add(newShape);
        canvas.renderAll();
        
        setState(prev => ({
          ...prev,
          currentShape: newShape
        }));
      });

      canvas.on('mouse:up', (opt) => {
        const currentState = stateRef.current;
        if (!currentState.isDrawing || !currentState.startPoint || currentState.drawingMode === 'select') return;
        
        const pointer = canvas.getPointer(opt.e);
        const { x: startX, y: startY } = currentState.startPoint;
        
        // Remove preview shape
        if (currentState.currentShape) {
          canvas.remove(currentState.currentShape);
        }
        
        let finalShape: fabric.Object;
        
        if (currentState.drawingMode === 'rectangle') {
          const width = Math.abs(pointer.x - startX);
          const height = Math.abs(pointer.y - startY);
          const left = Math.min(startX, pointer.x);
          const top = Math.min(startY, pointer.y);
          
          // Only create shape if it has minimum size
          if (width > 5 && height > 5) {
            finalShape = new fabric.Rect({
              left,
              top,
              width,
              height,
              fill: '#ff0000',
              stroke: '#000000',
              strokeWidth: 1
            });
            
            canvas.add(finalShape);
            canvas.setActiveObject(finalShape);
          }
        } else if (currentState.drawingMode === 'circle') {
          const radius = Math.sqrt(Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2));
          
          // Only create shape if it has minimum size
          if (radius > 5) {
            finalShape = new fabric.Circle({
              left: startX - radius,
              top: startY - radius,
              radius,
              fill: '#00ff00',
              stroke: '#000000',
              strokeWidth: 1
            });
            
            canvas.add(finalShape);
            canvas.setActiveObject(finalShape);
          }
        }
        
        canvas.renderAll();
        
        setState(prev => ({
          ...prev,
          isDrawing: false,
          startPoint: null,
          currentShape: null
        }));
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

    const textObject = new fabric.Text(text, {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: '#000000',
      ...options
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

    fabric.Image.fromURL(url, (img: fabric.Image) => {
      img.set({
        left: 100,
        top: 100,
        ...options
      });
      state.canvas!.add(img);
      state.canvas!.setActiveObject(img);
      state.canvas!.renderAll();
    });
  }, [state.canvas]);

  const deleteSelected = useCallback(() => {
    if (!state.canvas || state.selectedObjects.length === 0) return;

    state.selectedObjects.forEach(obj => {
      state.canvas!.remove(obj);
    });

    state.canvas.discardActiveObject();
    state.canvas.renderAll();
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

    const containerRect = container.getBoundingClientRect();
    const canvasRect = canvasElement.getBoundingClientRect();
    
    const centerX = (containerRect.width - canvasRect.width) / 2;
    const centerY = (containerRect.height - canvasRect.height) / 2;
    
    canvasElement.style.position = 'absolute';
    canvasElement.style.left = `${centerX}px`;
    canvasElement.style.top = `${centerY}px`;
  }, [state.canvas, containerRef]);

  const setDrawingMode = useCallback((mode: DrawingMode) => {
    console.log('Setting drawing mode to:', mode);
    setState(prev => ({
      ...prev,
      drawingMode: mode,
      isDrawing: false,
      startPoint: null,
      currentShape: null
    }));
  }, []);

  useEffect(() => {
    initializeCanvas();

    return () => {
      if (state.canvas) {
        state.canvas.dispose();
      }
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
  };
}
