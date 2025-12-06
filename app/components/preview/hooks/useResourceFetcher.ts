/**
 * Resource Fetcher Hook
 * Fetches Shopify resource data from the API endpoint
 */

import { useCallback, useState } from 'react';
import type { MockProduct, MockCollection, MockArticle } from '../mockData/types';

export type ResourceType = 'product' | 'collection' | 'article';

interface UseResourceFetcherReturn {
  fetchProduct: (productId: string) => Promise<MockProduct | null>;
  fetchProducts: (productIds: string[]) => Promise<MockProduct[]>;
  fetchCollection: (collectionId: string) => Promise<MockCollection | null>;
  fetchArticle: (articleId: string) => Promise<MockArticle | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for fetching Shopify resources from the API
 */
export function useResourceFetcher(): UseResourceFetcherReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResource = useCallback(async <T>(
    type: ResourceType,
    id: string
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/app/api/resource?type=${type}&id=${encodeURIComponent(id)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch ${type}`);
      }

      const result = await response.json();
      return result.data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${type}`;
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProduct = useCallback(async (productId: string): Promise<MockProduct | null> => {
    return fetchResource<MockProduct>('product', productId);
  }, [fetchResource]);

  const fetchProducts = useCallback(async (productIds: string[]): Promise<MockProduct[]> => {
    if (productIds.length === 0) return [];

    setLoading(true);
    setError(null);

    try {
      // Fetch all products in parallel
      const results = await Promise.all(
        productIds.map(id => fetchResource<MockProduct>('product', id))
      );
      return results.filter((p): p is MockProduct => p !== null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchResource]);

  const fetchCollection = useCallback(async (collectionId: string): Promise<MockCollection | null> => {
    return fetchResource<MockCollection>('collection', collectionId);
  }, [fetchResource]);

  const fetchArticle = useCallback(async (articleId: string): Promise<MockArticle | null> => {
    return fetchResource<MockArticle>('article', articleId);
  }, [fetchResource]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    fetchProduct,
    fetchProducts,
    fetchCollection,
    fetchArticle,
    loading,
    error,
    clearError
  };
}
