import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import { ImageProcessor } from '../../lib/services/imageProcessor';
import { executeQuery } from '../../lib/database';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// Middleware to run multer
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are allowed' 
    });
  }

  try {
    // Run multer middleware
    await runMiddleware(req, res, upload.single('image'));

    const file = (req as any).file;
    if (!file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select an image file to upload' 
      });
    }

    // Validate file
    ImageProcessor.validateImageFile(file);

    // Save file to disk
    const filename = await ImageProcessor.saveUploadedFile(file.buffer, file.originalname);
    const filePath = path.join(process.env.UPLOAD_DIR || './public/uploads', filename);

    // Extract features from uploaded image
    const features = await ImageProcessor.extractFeaturesFromFile(filePath);

    // Save upload record to database
    const query = `
      INSERT INTO user_uploads (image_path, original_filename, features, session_id)
      VALUES (?, ?, ?, ?)
    `;
    const sessionId = req.headers['x-session-id'] || 'anonymous';
    const result: any = await executeQuery(query, [
      filename,
      file.originalname,
      JSON.stringify(features),
      sessionId
    ]);

    res.status(200).json({
      success: true,
      uploadId: result.insertId,
      filename: filename,
      features: features,
      imageUrl: `/uploads/${filename}`,
      message: 'Image uploaded and processed successfully'
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Handle specific error types
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      message: 'An error occurred while processing your image. Please try again.'
    });
  }
}

// Disable body parser for multer
export const config = {
  api: {
    bodyParser: false,
  },
};