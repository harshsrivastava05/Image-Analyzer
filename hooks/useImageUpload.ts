import { useState } from 'react';

interface ImageUploadState {
  isLoading: boolean;
  uploadedImage: string | null;
  features: number[] | null;
  error: string | null;
  success: string | null;
}

interface UseImageUploadReturn {
  state: ImageUploadState;
  uploadFile: (file: File) => Promise<void>;
  uploadFromUrl: (url: string) => Promise<void>;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

export function useImageUpload(): UseImageUploadReturn {
  const [state, setState] = useState<ImageUploadState>({
    isLoading: false,
    uploadedImage: null,
    features: null,
    error: null,
    success: null
  });

  const uploadFile = async (file: File): Promise<void> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: null
    }));

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-session-id': generateSessionId()
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      setState(prev => ({
        ...prev,
        isLoading: false,
        uploadedImage: previewUrl,
        features: data.features,
        success: data.message || 'Image uploaded successfully',
        error: null
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to upload image'
      }));
    }
  };

  const uploadFromUrl = async (url: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      success: null
    }));

    try {
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': generateSessionId()
        },
        body: JSON.stringify({ imageUrl: url })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'URL upload failed');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        uploadedImage: url,
        features: data.features,
        success: data.message || 'Image loaded successfully from URL',
        error: null
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to load image from URL'
      }));
    }
  };

  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearSuccess = (): void => {
    setState(prev => ({ ...prev, success: null }));
  };

  const reset = (): void => {
    setState({
      isLoading: false,
      uploadedImage: null,
      features: null,
      error: null,
      success: null
    });
  };

  return {
    state,
    uploadFile,
    uploadFromUrl,
    clearError,
    clearSuccess,
    reset
  };
}

// Generate a simple session ID for tracking
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}