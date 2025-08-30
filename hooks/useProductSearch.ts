import { useState, useCallback } from 'react';
import { SearchResult } from '../lib/database';

interface SearchOptions {
  categoryFilter?: string;
  minSimilarity?: number;
  maxResults?: number;
  method?: 'cosine' | 'euclidean';
}

interface SearchState {
  isLoading: boolean;
  error: string | null;
  results: SearchResult[];
  stats: any;
}

interface UseProductSearchReturn {
  state: SearchState;
  searchProducts: (features: number[], options?: SearchOptions) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export const useProductSearch = (): UseProductSearchReturn => {
  const [state, setState] = useState<SearchState>({
    isLoading: false,
    error: null,
    results: [],
    stats: null
  });

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearResults = useCallback(() => {
    setState(prev => ({ ...prev, results: [], stats: null, error: null }));
  }, []);

  const searchProducts = useCallback(async (features: number[], options: SearchOptions = {}) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      if (!features || features.length === 0) {
        throw new Error('Invalid features provided');
      }

      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          features,
          ...options
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Search failed');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        results: data.results || [],
        stats: data.stats
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to search products'
      }));
    }
  }, []);

  return {
    state,
    searchProducts,
    clearResults,
    clearError
  };
};