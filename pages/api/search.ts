import { NextApiRequest, NextApiResponse } from 'next';
import { SimilarityService, SimilarityOptions } from '../../lib/services/similarityService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  try {
    const { features, categoryFilter, minSimilarity, maxResults, method } = req.body;

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ 
        error: 'Invalid features',
        message: 'Please provide valid image features array' 
      });
    }

    if (features.length === 0) {
      return res.status(400).json({ 
        error: 'Empty features',
        message: 'Features array cannot be empty' 
      });
    }

    // Prepare search options
    const options: SimilarityOptions = {
      categoryFilter: categoryFilter || undefined,
      minSimilarity: typeof minSimilarity === 'number' ? minSimilarity : 0,
      maxResults: typeof maxResults === 'number' ? Math.min(maxResults, 100) : 50,
      method: method === 'euclidean' ? 'euclidean' : 'cosine'
    };

    // Find similar products
    const results = await SimilarityService.findSimilarProducts(features, options);

    // Get statistics
    const stats = SimilarityService.getSimilarityStats(results);

    res.status(200).json({
      success: true,
      results: results,
      count: results.length,
      stats: stats,
      options: options,
      message: `Found ${results.length} similar products`
    });

  } catch (error: any) {
    console.error('Search error:', error);
    
    // Handle specific error types
    if (error.message.includes('Database')) {
      return res.status(500).json({
        error: 'Database error',
        message: 'Unable to search products. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while searching for similar products. Please try again.'
    });
  }
}