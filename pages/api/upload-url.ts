import { NextApiRequest, NextApiResponse } from 'next';
import { ImageProcessor } from '../../lib/services/imageProcessor';
import { executeQuery } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        error: 'Missing image URL',
        message: 'Please provide a valid image URL' 
      });
    }

    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid image URL'
      });
    }

    // Extract features from image URL
    const features = await ImageProcessor.extractFeaturesFromURL(imageUrl);

    // Save upload record to database
    const query = `
      INSERT INTO user_uploads (image_path, original_filename, features, session_id)
      VALUES (?, ?, ?, ?)
    `;
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    const result: any = await executeQuery(query, [
      imageUrl,
      'url-upload',
      JSON.stringify(features),
      sessionId
    ]);

    res.status(200).json({
      success: true,
      uploadId: result.insertId,
      features: features,
      imageUrl: imageUrl,
      message: 'Image processed successfully from URL'
    });

  } catch (error: any) {
    console.error('URL upload error:', error);
    
    // Handle specific error types
    if (error.message.includes('Failed to download')) {
      return res.status(400).json({
        error: 'Download failed',
        message: 'Unable to download image from URL. Please check the URL and try again.'
      });
    }
    
    if (error.message.includes('CORS')) {
      return res.status(400).json({
        error: 'Access denied',
        message: 'Cannot access this image due to CORS restrictions. Try uploading the file directly.'
      });
    }

    res.status(500).json({
      error: 'Processing failed',
      message: 'An error occurred while processing the image URL. Please try again.'
    });
  }
}