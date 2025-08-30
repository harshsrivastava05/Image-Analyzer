import { NextApiRequest, NextApiResponse } from 'next';
import { getConnection } from '../../lib/database';
import { ProductService } from '../../lib/services/productService';
import { ImageProcessor } from '../../lib/services/imageProcessor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are allowed' 
    });
  }

  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: false,
      imageProcessor: false,
      fileSystem: false
    },
    stats: {
      productCount: 0,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  };

  try {
    // Check database connection
    try {
      await getConnection();
      const productCount = await ProductService.getProductCount();
      healthStatus.checks.database = true;
      healthStatus.stats.productCount = productCount;
    } catch (error) {
      console.error('Database health check failed:', error);
      healthStatus.checks.database = false;
      healthStatus.status = 'degraded';
    }

    // Check image processor
    try {
      healthStatus.checks.imageProcessor = ImageProcessor.isModelReady();
    } catch (error) {
      console.error('Image processor health check failed:', error);
      healthStatus.checks.imageProcessor = false;
    }

    // Check file system (upload directory)
    try {
      const fs = await import('fs/promises');
      const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
      await fs.mkdir(uploadDir, { recursive: true });
      healthStatus.checks.fileSystem = true;
    } catch (error) {
      console.error('File system health check failed:', error);
      healthStatus.checks.fileSystem = false;
      healthStatus.status = 'degraded';
    }

    // Determine overall status
    const allChecksPass = Object.values(healthStatus.checks).every(check => check === true);
    if (!allChecksPass && healthStatus.status === 'healthy') {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error: any) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error.message || 'Unknown error during health check'
    });
  }
}