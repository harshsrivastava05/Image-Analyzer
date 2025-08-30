import { useState, useRef } from 'react';
import { Upload, Loader2, X } from 'lucide-react';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onUrlUpload: (url: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onUrlUpload,
  isLoading = false,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || isLoading) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only remove drag over if we're leaving the upload area entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
    // Reset input value to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onUrlUpload(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleUrlKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUrlSubmit();
    }
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
          }
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isLoading}
        />
        
        <div className="flex flex-col items-center">
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          ) : (
            <Upload className="w-12 h-12 text-blue-500 mb-4" />
          )}
          
          <h3 className="text-xl font-semibold mb-2">
            {isLoading ? 'Processing...' : 'Upload an Image'}
          </h3>
          
          <p className="text-gray-600">
            {isLoading 
              ? 'Please wait while we process your image'
              : 'Drag and drop an image here, or click to browse'
            }
          </p>
          
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-2">
              Supports JPEG, PNG, WebP (max 10MB)
            </p>
          )}
        </div>
      </div>

      {/* URL Input Section */}
      <div className="border-t pt-6">
        <p className="text-center mb-4 text-gray-600">Or enter an image URL:</p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={handleUrlKeyPress}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled || isLoading}
            />
            {urlInput && (
              <button
                onClick={() => setUrlInput('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleUrlSubmit}
            disabled={disabled || isLoading || !urlInput.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Load URL'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};