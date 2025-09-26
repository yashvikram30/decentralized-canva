// Constants for WalrusCanvas AI

export const CANVAS_CONFIG = {
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  BACKGROUND_COLOR: 'white',
  GRID_SIZE: 20,
} as const;

export const AI_CONFIG = {
  DEFAULT_MODEL: 'gpt-4',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.7,
  IMAGE_SIZE: '1024x1024',
  IMAGE_QUALITY: 'standard',
} as const;

export const ENCRYPTION_CONFIG = {
  ALGORITHM: 'AES-256-GCM',
  KEY_SIZE: 256,
  IV_SIZE: 16,
} as const;

export const WALRUS_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_TYPES: ['application/json', 'image/png', 'image/jpeg'],
} as const;

export const UI_CONFIG = {
  SIDEBAR_WIDTH: 256,
  TOOLBAR_HEIGHT: 60,
  ANIMATION_DURATION: 300,
} as const;

export const ERROR_MESSAGES = {
  ENCRYPTION_FAILED: 'Failed to encrypt data',
  DECRYPTION_FAILED: 'Failed to decrypt data',
  STORAGE_FAILED: 'Failed to store data',
  RETRIEVAL_FAILED: 'Failed to retrieve data',
  ACCESS_DENIED: 'Access denied: insufficient permissions',
  AI_GENERATION_FAILED: 'AI generation failed',
  INVALID_DATA: 'Invalid data provided',
} as const;

export const SUCCESS_MESSAGES = {
  DESIGN_SAVED: 'Design saved successfully',
  DESIGN_LOADED: 'Design loaded successfully',
  DESIGN_UPDATED: 'Design updated successfully',
  DESIGN_DELETED: 'Design deleted successfully',
  ENCRYPTION_ENABLED: 'Encryption enabled',
  ACCESS_GRANTED: 'Access granted',
} as const;
