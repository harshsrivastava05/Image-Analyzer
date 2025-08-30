import { useState } from 'react';
import { SearchResult } from '../lib/database';
import { SimilarityOptions, SimilarityStats } from '../lib/services/similarityService';

interface ProductSearchState {
  isLoading: boolean;
  results: SearchResult[];
  error: string | null;
  stats: SimilarityStats | null;
}

interface UseProductSearchReturn {
  state: ProductSearchState;
  searchProducts: (features: number[], options?: SimilarityOptions) => Promise<void>;
  clearResults: () => void;
  clearError: () => void;
}

export function useProductSearch(): UseProductSearchReturn {
  const [state, setState] = useState<ProductSearchState>({
    isLoading: false,
    results: [],
    error: null,
    stats: null
  });

  const searchProducts = async (
    features: number[], 
    options: SimilarityOptions = {}
  ): Promise<void> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          features,
          categoryFilter: options.categoryFilter,
          minSimilarity: options.minSimilarity || 0,
          maxResults: options.maxResults || 50,
          method: options.method || 'cosine'
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
        stats: data.stats || null,
        error: null
      }));

    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to search products'
      }));
    }
  };

  const clearResults = (): void => {
    setState(prev => ({
      ...prev,
      results: [],
      stats: null
    }));
  };

  const clearError = (): void => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    state,
    searchProducts,
    clearResults,
    clearError
  };
}