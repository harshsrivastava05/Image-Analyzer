import { ProductService } from './productService';
import { ImageProcessor } from './imageProcessor';
import { Product, SearchResult } from '../database';

export interface SimilarityOptions {
  categoryFilter?: string;
  minSimilarity?: number;
  maxResults?: number;
  method?: 'cosine' | 'euclidean';
}

export interface SimilarityStats {
  total: number;
  avg: number;
  min: number;
  max: number;
  categories: { [key: string]: number };
}

export class SimilarityService {
  /**
   * Calculate cosine similarity between two feature vectors
   */
  private static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Feature vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Calculate Euclidean distance between two feature vectors
   */
  private static euclideanDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Feature vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }

    return Math.sqrt(sum);
  }

  /**
   * Convert Euclidean distance to similarity score (0-1)
   */
  private static distanceToSimilarity(distance: number, maxDistance: number = 2): number {
    return Math.max(0, 1 - (distance / maxDistance));
  }

  /**
   * Find similar products based on feature vector
   */
  static async findSimilarProducts(
    queryFeatures: number[],
    options: SimilarityOptions = {}
  ): Promise<SearchResult[]> {
    try {
      // Get products with features
      const products = await ProductService.getProductsWithFeatures();
      
      if (products.length === 0) {
        throw new Error('No products with features found in database');
      }

      const results: SearchResult[] = [];

      for (const product of products) {
        if (!product.features || product.features.length === 0) {
          continue;
        }

        // Skip if category filter is applied and doesn't match
        if (options.categoryFilter && product.category !== options.categoryFilter) {
          continue;
        }

        let similarity: number;

        // Calculate similarity based on method
        if (options.method === 'euclidean') {
          const distance = this.euclideanDistance(queryFeatures, product.features);
          similarity = this.distanceToSimilarity(distance);
        } else {
          // Default to cosine similarity
          similarity = this.cosineSimilarity(queryFeatures, product.features);
        }

        // Skip if below minimum similarity threshold
        if (similarity < (options.minSimilarity || 0)) {
          continue;
        }

        const searchResult: SearchResult = {
          ...product,
          similarity,
          matchScore: Math.round(similarity * 100)
        };

        results.push(searchResult);
      }

      // Sort by similarity (highest first)
      results.sort((a, b) => b.similarity - a.similarity);

      // Limit results
      const maxResults = options.maxResults || 50;
      return results.slice(0, maxResults);

    } catch (error) {
      console.error('Error finding similar products:', error);
      throw new Error('Failed to find similar products');
    }
  }

  /**
   * Calculate statistics for similarity results
   */
  static getSimilarityStats(results: SearchResult[]): SimilarityStats {
    if (results.length === 0) {
      return {
        total: 0,
        avg: 0,
        min: 0,
        max: 0,
        categories: {}
      };
    }

    const similarities = results.map(r => r.similarity);
    const categories: { [key: string]: number } = {};

    // Count categories
    results.forEach(result => {
      categories[result.category] = (categories[result.category] || 0) + 1;
    });

    return {
      total: results.length,
      avg: similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length,
      min: Math.min(...similarities),
      max: Math.max(...similarities),
      categories
    };
  }

  /**
   * Batch process all products to extract features
   */
  static async batchProcessProducts(): Promise<void> {
    try {
      console.log('Starting batch processing of products...');
      
      // Initialize image processor
      await ImageProcessor.initialize();

      // Get all products without features
      const products = await ProductService.getAllProducts();
      
      const productsToUpdate: Array<{ id: number; features: number[] }> = [];

      for (const product of products) {
        try {
          console.log(`Processing product ${product.id}: ${product.name}`);
          
          // Extract features from product image
          const features = await ImageProcessor.extractFeaturesFromURL(product.image_url);
          
          productsToUpdate.push({
            id: product.id,
            features
          });

          console.log(`✓ Processed product ${product.id} (${features.length} features)`);
          
        } catch (error) {
          console.error(`✗ Failed to process product ${product.id}:`, error);
          // Continue with next product
        }
      }

      // Batch update features
      if (productsToUpdate.length > 0) {
        await ProductService.batchUpdateFeatures(productsToUpdate);
        console.log(`✓ Updated features for ${productsToUpdate.length} products`);
      }

      console.log('Batch processing completed successfully');
      
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw new Error('Batch processing failed');
    }
  }

  /**
   * Generate dummy features for testing when model isn't available
   */
  static generateDummyFeatures(seed?: string): number[] {
    const features: number[] = [];
    const random = seed ? this.seededRandom(seed) : Math.random;
    
    for (let i = 0; i < 64; i++) {
      features.push(random() * 2 - 1); // Random values between -1 and 1
    }
    
    return features;
  }

  /**
   * Seeded random number generator for consistent dummy features
   */
  private static seededRandom(seed: string): () => number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return function() {
      hash = (hash * 9301 + 49297) % 233280;
      return hash / 233280;
    };
  }

  /**
   * Extract simple features using basic image analysis
   */
  static async extractSimpleFeatures(imageBuffer: Buffer): Promise<number[]> {
    try {
      return await ImageProcessor.extractSimpleFeatures(imageBuffer);
    } catch (error) {
      console.error('Error extracting simple features:', error);
      throw new Error('Failed to extract image features');
    }
  }

  /**
   * Compare two products based on their features
   */
  static compareProducts(product1: Product, product2: Product): number {
    if (!product1.features || !product2.features) {
      return 0;
    }

    return this.cosineSimilarity(product1.features, product2.features);
  }

  /**
   * Get feature vector statistics
   */
  static getFeatureStats(features: number[]): {
    mean: number;
    std: number;
    min: number;
    max: number;
  } {
    const mean = features.reduce((sum, val) => sum + val, 0) / features.length;
    const variance = features.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / features.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      std,
      min: Math.min(...features),
      max: Math.max(...features)
    };
  }
}