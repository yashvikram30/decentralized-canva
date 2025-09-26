// Font loading utility for Fabric.js
import { fabric } from '@/lib/fabric';

export interface FontInfo {
  name: string;
  displayName: string;
  url: string;
  fallback: string;
}

// Define available fonts with their URLs
export const AVAILABLE_FONTS: FontInfo[] = [
  {
    name: 'Arial',
    displayName: 'Arial',
    url: '/fonts/arial.woff2',
    fallback: 'Arial, sans-serif'
  },
  {
    name: 'Helvetica',
    displayName: 'Helvetica',
    url: '/fonts/helvetica.woff2',
    fallback: 'Helvetica, sans-serif'
  },
  {
    name: 'Times New Roman',
    displayName: 'Times New Roman',
    url: '/fonts/times-new-roman.woff2',
    fallback: 'Times New Roman, serif'
  },
  {
    name: 'Georgia',
    displayName: 'Georgia',
    url: '/fonts/georgia.woff2',
    fallback: 'Georgia, serif'
  },
  {
    name: 'Verdana',
    displayName: 'Verdana',
    url: '/fonts/verdana.woff2',
    fallback: 'Verdana, sans-serif'
  },
  {
    name: 'Courier New',
    displayName: 'Courier New',
    url: '/fonts/courier-new.woff2',
    fallback: 'Courier New, monospace'
  },
  {
    name: 'Impact',
    displayName: 'Impact',
    url: '/fonts/impact.woff2',
    fallback: 'Impact, sans-serif'
  },
  {
    name: 'Comic Sans MS',
    displayName: 'Comic Sans MS',
    url: '/fonts/comic-sans-ms.woff2',
    fallback: 'Comic Sans MS, cursive'
  }
];

// Font loading state
const loadedFonts = new Set<string>();
const loadingFonts = new Set<string>();

// Load a single font
export const loadFont = async (fontInfo: FontInfo): Promise<boolean> => {
  const { name, url, fallback } = fontInfo;
  
  // Return true if already loaded
  if (loadedFonts.has(name)) {
    return true;
  }
  
  // Return false if currently loading
  if (loadingFonts.has(name)) {
    return false;
  }
  
  loadingFonts.add(name);
  
  try {
    // Create a font face
    const fontFace = new FontFace(name, `url(${url})`);
    
    // Load the font
    const loadedFont = await fontFace.load();
    
    // Add to document
    document.fonts.add(loadedFont);
    
    // Mark as loaded
    loadedFonts.add(name);
    loadingFonts.delete(name);
    
    console.log(`Font loaded successfully: ${name}`);
    return true;
  } catch (error) {
    console.warn(`Failed to load font ${name}:`, error);
    loadingFonts.delete(name);
    
    // Try to use fallback font
    try {
      const fallbackFont = new FontFace(name, `local(${fallback})`);
      document.fonts.add(fallbackFont);
      loadedFonts.add(name);
      console.log(`Using fallback font for ${name}`);
      return true;
    } catch (fallbackError) {
      console.error(`Failed to load fallback font for ${name}:`, fallbackError);
      return false;
    }
  }
};

// Load all fonts
export const loadAllFonts = async (): Promise<void> => {
  console.log('Loading all fonts...');
  
  const loadPromises = AVAILABLE_FONTS.map(font => loadFont(font));
  const results = await Promise.allSettled(loadPromises);
  
  const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
  console.log(`Loaded ${successCount}/${AVAILABLE_FONTS.length} fonts successfully`);
};

// Check if a font is loaded
export const isFontLoaded = (fontName: string): boolean => {
  return loadedFonts.has(fontName);
};

// Get font info by name
export const getFontInfo = (fontName: string): FontInfo | undefined => {
  return AVAILABLE_FONTS.find(font => font.name === fontName);
};

// Safe font family update for Fabric.js objects
export const updateTextFontFamily = async (
  textObject: fabric.Textbox | fabric.Text, 
  fontName: string,
  canvas: fabric.Canvas
): Promise<boolean> => {
  try {
    const fontInfo = getFontInfo(fontName);
    
    if (!fontInfo) {
      console.warn(`Font info not found for: ${fontName}`);
      return false;
    }
    
    // Try to load the font if not already loaded
    const fontLoaded = await loadFont(fontInfo);
    
    if (!fontLoaded) {
      console.warn(`Failed to load font: ${fontName}, using fallback`);
    }
    
    // Clear fabric font cache
    if (fabric.util && fabric.util.clearFabricFontCache) {
      fabric.util.clearFabricFontCache();
    }
    
    // Update the text object
    textObject.set({ fontFamily: fontName });
    
    // Recalculate dimensions
    textObject.setCoords();
    if (textObject.initDimensions) {
      textObject.initDimensions();
    }
    
    // Mark as dirty and render
    textObject.dirty = true;
    canvas.renderAll();
    
    console.log(`Font family updated to: ${fontName}`);
    return true;
    
  } catch (error) {
    console.error(`Error updating font family to ${fontName}:`, error);
    return false;
  }
};

// Initialize fonts on app start
export const initializeFonts = async (): Promise<void> => {
  try {
    await loadAllFonts();
    console.log('Font initialization completed');
  } catch (error) {
    console.error('Font initialization failed:', error);
  }
};
