import { useState, useCallback } from 'react';

interface UploadState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  uploadedImage: string | null;
  features: number[] | null;
}

interface UseImageUploadReturn {
  state: UploadState;
  uploadFile: (file: File) => Promise<void>;
  uploadFromUrl: (url: string) => Promise<void>;
  clearState: () => void;
  clearError: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [state, setState] = useState<UploadState>({
    isLoading: false,
    error: null,
    success: null,
    uploadedImage: null,
    features: null
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      success: null,
      uploadedImage: null,
      features: null
    });
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, success: null }));

      // Validate file on client side
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File size must be less than 10MB');
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-session-id': `session-${Date.now()}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        uploadedImage: data.imageUrl,
        features: data.features,
        success: data.message
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to upload image'
      }));
    }
  }, []);

  const uploadFromUrl = useCallback(async (imageUrl: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, success: null }));

      // Validate URL on client side
      try {
        new URL(imageUrl);
      } catch {
        throw new Error('Please enter a valid URL');
      }

      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': `session-${Date.now()}`
        },
        body: JSON.stringify({ imageUrl })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'URL processing failed');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        uploadedImage: data.imageUrl,
        features: data.features,
        success: data.message
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to process image URL'
      }));
    }
  }, []);

  return {
    state,
    uploadFile,
    uploadFromUrl,
    clearState,
    clearError
  };
};