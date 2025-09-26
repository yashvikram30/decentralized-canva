'use client';

import React, { useState } from 'react';
import { Upload, X, Link } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddImage: (url: string) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ImageModal({ isOpen, onClose, onAddImage, containerRef }: ImageModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  console.log('ImageModal render - isOpen:', isOpen);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
      onClose();
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl) {
      onAddImage(imageUrl);
      setImageUrl('');
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        style={{ zIndex: 9998 }}
      />
      
      {/* Modal Content - Centered */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Image</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Local File Upload - Primary Option */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Upload from Computer</h3>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
              <div className={cn(
                "flex items-center justify-center space-x-3 p-6 text-sm bg-gray-50 text-gray-600 rounded-lg border-2 border-dashed border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors",
                isUploading && "opacity-50 cursor-not-allowed"
              )}>
                <Upload className="w-6 h-6" />
                <span className="font-medium">
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
            <span className="px-3 text-sm text-gray-500">or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          
          {/* URL Input - Secondary Option */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Add from URL</h3>
            <div className="space-y-3">
              <div className="relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  placeholder="Enter image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl}
                  className="flex-1 px-4 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add Image
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-3 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
