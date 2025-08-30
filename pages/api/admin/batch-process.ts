import { NextApiRequest, NextApiResponse } from 'next';
import { SimilarityService } from '../../../lib/services/similarityService';
import { ImageProcessor } from '../../../lib/services/imageProcessor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  // Basic authentication (in production, use proper auth)
  const authToken = req.headers.authorization;
  if (authToken !== `Bearer ${process.env.ADMIN_TOKEN}`) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid authentication token'
    });
  }

  try {
    // Initialize image processor
    await ImageProcessor.initialize();

    // Start batch processing
    console.log('Starting batch processing of products...');
    await SimilarityService.batchProcessProducts();

    res.status(200).json({
      success: true,
      message: 'Batch processing completed successfully'
    });

  } catch (error: any) {
    console.error('Batch processing error:', error);
    res.status(500).json({
      error: 'Batch processing failed',
      message: error.message || 'An error occurred during batch processing'
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};