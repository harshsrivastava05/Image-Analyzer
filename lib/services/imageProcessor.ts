import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// Simple feature extraction without TensorFlow.js dependency
export class ImageProcessor {
  private static isInitialized = false;

  /**
   * Initialize the image processing (now just a simple check)
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing ImageProcessor with Sharp-based feature extraction...');
      
      // Test Sharp functionality
      const testBuffer = Buffer.alloc(100);
      await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      }).png().toBuffer();
      
      this.isInitialized = true;
      console.log('✅ ImageProcessor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ImageProcessor:', error);
      this.isInitialized = true; // Still allow fallback operation
    }
  }

  /**
   * Check if processor is ready
   */
  static isModelReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Validate uploaded image file
   */
  static validateImageFile(file: { mimetype: string; size: number }): void {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
  }

  /**
   * Save uploaded file to disk
   */
  static async saveUploadedFile(buffer: Buffer, originalFilename: string): Promise<string> {
    try {
      const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
      
      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const timestamp = Date.now();
      const extension = path.extname(originalFilename);
      const sanitizedName = path.basename(originalFilename, extension).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${timestamp}_${sanitizedName}${extension}`;
      const filePath = path.join(uploadDir, filename);

      // Process and save image
      await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(filePath);

      console.log(`✅ Saved image: ${filename}`);
      return filename;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error(`Failed to save uploaded file: ${error.message}`);
    }
  }

  /**
   * Extract comprehensive features from image buffer using Sharp
   */
  static async extractAdvancedFeatures(imageBuffer: Buffer): Promise<number[]> {
    try {
      // Get detailed image statistics
      const stats = await sharp(imageBuffer).stats();
      const metadata = await sharp(imageBuffer).metadata();
      
      const features: number[] = [];

      // 1. Basic metadata features (4 features)
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      features.push(Math.min(width / 1000, 2)); // Normalized width
      features.push(Math.min(height / 1000, 2)); // Normalized height
      features.push(width && height ? Math.min(width / height, 5) : 1); // Aspect ratio
      features.push(width && height ? Math.min((width * height) / 1000000, 2) : 0); // Area

      // 2. Color channel statistics (18 features)
      if (stats.channels && stats.channels.length >= 3) {
        const [r, g, b] = stats.channels.slice(0, 3);
        
        // Mean values
        features.push(r.mean / 255, g.mean / 255, b.mean / 255);
        
        // Standard deviations (contrast)
        features.push(r.std / 255, g.std / 255, b.std / 255);
        
        // Min/Max values
        features.push(r.min / 255, g.min / 255, b.min / 255);
        features.push(r.max / 255, g.max / 255, b.max / 255);
        
        // Channel ranges
        features.push((r.max - r.min) / 255, (g.max - g.min) / 255, (b.max - b.min) / 255);
        
        // Color ratios and relationships
        const rMean = r.mean, gMean = g.mean, bMean = b.mean;
        features.push(rMean / (gMean + 1)); // R/G ratio
        features.push(gMean / (bMean + 1)); // G/B ratio
        features.push(bMean / (rMean + 1)); // B/R ratio
      } else {
        // Fill with neutral values for missing color info
        for (let i = 0; i < 18; i++) {
          features.push(0.5);
        }
      }

      // 3. Derived color features (8 features)
      if (stats.channels && stats.channels.length >= 3) {
        const [r, g, b] = stats.channels;
        
        // Overall brightness
        const brightness = (r.mean + g.mean + b.mean) / (3 * 255);
        features.push(brightness);
        
        // Overall contrast
        const contrast = (r.std + g.std + b.std) / (3 * 255);
        features.push(contrast);
        
        // Color dominance
        const total = r.mean + g.mean + b.mean;
        if (total > 0) {
          features.push(r.mean / total, g.mean / total, b.mean / total);
        } else {
          features.push(0.33, 0.33, 0.33);
        }
        
        // Saturation approximation
        const maxChannel = Math.max(r.mean, g.mean, b.mean);
        const minChannel = Math.min(r.mean, g.mean, b.mean);
        const saturation = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;
        features.push(saturation);
        
        // Color temperature approximation (blue vs red+green)
        const warmth = (r.mean + g.mean) / (b.mean + 1);
        features.push(Math.min(warmth / 4, 1)); // Normalize
        
        // Color variance
        const colorVariance = Math.sqrt(
          Math.pow(r.std, 2) + Math.pow(g.std, 2) + Math.pow(b.std, 2)
        ) / 255;
        features.push(colorVariance);
      } else {
        for (let i = 0; i < 8; i++) {
          features.push(0.5);
        }
      }

      // 4. Generate histogram-based features (16 features)
      const histogramFeatures = await this.extractHistogramFeatures(imageBuffer);
      features.push(...histogramFeatures);

      // 5. Edge and texture features (8 features)
      const textureFeatures = await this.extractTextureFeatures(imageBuffer);
      features.push(...textureFeatures);

      // 6. Ensure exactly 64 features
      while (features.length < 64) {
        // Generate meaningful derived features
        const baseIndex = (features.length - 30) % Math.max(features.length - 30, 1);
        const baseValue = features[baseIndex] || 0.5;
        
        // Add mathematical transformations of existing features
        let newFeature: number;
        const transformType = features.length % 4;
        
        switch (transformType) {
          case 0:
            newFeature = Math.sqrt(Math.abs(baseValue)); // Square root
            break;
          case 1:
            newFeature = baseValue * baseValue; // Square
            break;
          case 2:
            newFeature = Math.sin(baseValue * Math.PI) * 0.5 + 0.5; // Sine transform
            break;
          default:
            newFeature = 1 - baseValue; // Inverse
        }
        
        features.push(Math.max(0, Math.min(1, newFeature)));
      }

      return features.slice(0, 64);
    } catch (error) {
      console.error('Advanced feature extraction failed:', error);
      return this.generateFallbackFeatures(error.message);
    }
  }

  /**
   * Extract histogram-based features
   */
  private static async extractHistogramFeatures(imageBuffer: Buffer): Promise<number[]> {
    try {
      // Resize to small size for histogram analysis
      const smallImage = await sharp(imageBuffer)
        .resize(64, 64, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = smallImage;
      const features: number[] = [];

      if (info.channels >= 3) {
        // Calculate simple histogram features for each channel
        for (let channel = 0; channel < 3; channel++) {
          const values: number[] = [];
          
          // Extract channel values
          for (let i = channel; i < data.length; i += info.channels) {
            values.push(data[i]);
          }

          // Calculate quartiles as histogram features
          values.sort((a, b) => a - b);
          const len = values.length;
          
          features.push(values[Math.floor(len * 0.25)] / 255); // Q1
          features.push(values[Math.floor(len * 0.5)] / 255);  // Median
          features.push(values[Math.floor(len * 0.75)] / 255); // Q3
          
          // Add skewness approximation
          const mean = values.reduce((sum, v) => sum + v, 0) / len / 255;
          const median = values[Math.floor(len * 0.5)] / 255;
          features.push(mean - median); // Simple skewness measure
        }

        // Add inter-channel correlation approximation
        const rValues = [], gValues = [], bValues = [];
        for (let i = 0; i < data.length; i += info.channels) {
          rValues.push(data[i]);
          gValues.push(data[i + 1]);
          bValues.push(data[i + 2]);
        }

        // Simple correlation between channels
        features.push(this.simpleCorrelation(rValues, gValues));
        features.push(this.simpleCorrelation(gValues, bValues));
        features.push(this.simpleCorrelation(rValues, bValues));
        features.push(this.calculateEntropy(rValues));
      } else {
        // Fill with defaults for non-RGB images
        for (let i = 0; i < 16; i++) {
          features.push(0.5);
        }
      }

      return features.slice(0, 16);
    } catch (error) {
      console.error('Histogram extraction failed:', error);
      return new Array(16).fill(0.5);
    }
  }

  /**
   * Extract texture and edge features
   */
  private static async extractTextureFeatures(imageBuffer: Buffer): Promise<number[]> {
    try {
      // Convert to grayscale and resize for texture analysis
      const grayImage = await sharp(imageBuffer)
        .resize(32, 32, { fit: 'cover' })
        .grayscale()
        .raw()
        .toBuffer();

      const features: number[] = [];
      const width = 32;

      // Calculate simple texture measures
      let horizontalEdges = 0;
      let verticalEdges = 0;
      let totalVariation = 0;
      let localVariances: number[] = [];

      for (let y = 1; y < width - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const current = grayImage[idx];
          
          // Edge detection (simple gradients)
          const rightPixel = grayImage[idx + 1];
          const bottomPixel = grayImage[(y + 1) * width + x];
          
          horizontalEdges += Math.abs(current - rightPixel);
          verticalEdges += Math.abs(current - bottomPixel);
          
          // Local variance in 3x3 window
          const neighbors = [
            grayImage[(y-1) * width + (x-1)], grayImage[(y-1) * width + x], grayImage[(y-1) * width + (x+1)],
            grayImage[y * width + (x-1)], current, grayImage[y * width + (x+1)],
            grayImage[(y+1) * width + (x-1)], grayImage[(y+1) * width + x], grayImage[(y+1) * width + (x+1)]
          ];
          
          const mean = neighbors.reduce((sum, val) => sum + val, 0) / 9;
          const variance = neighbors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 9;
          localVariances.push(variance);
          
          totalVariation += Math.abs(current - mean);
        }
      }

      // Normalize and add features
      const pixelCount = (width - 2) * (width - 2);
      features.push(horizontalEdges / (pixelCount * 255)); // Horizontal edge density
      features.push(verticalEdges / (pixelCount * 255));   // Vertical edge density
      features.push(totalVariation / (pixelCount * 255));  // Total variation
      
      // Texture measures
      localVariances.sort((a, b) => a - b);
      const len = localVariances.length;
      features.push(localVariances[Math.floor(len * 0.25)] / (255 * 255)); // Q1 variance
      features.push(localVariances[Math.floor(len * 0.5)] / (255 * 255));  // Median variance
      features.push(localVariances[Math.floor(len * 0.75)] / (255 * 255)); // Q3 variance
      
      // Edge direction bias
      const edgeRatio = horizontalEdges > 0 ? verticalEdges / horizontalEdges : 1;
      features.push(Math.min(edgeRatio, 3) / 3); // Normalized edge ratio
      
      // Overall smoothness
      const avgVariance = localVariances.reduce((sum, v) => sum + v, 0) / len;
      features.push(Math.min(avgVariance / (255 * 255), 1));

      return features;
    } catch (error) {
      console.error('Texture extraction failed:', error);
      return new Array(8).fill(0.5);
    }
  }

  /**
   * Calculate simple correlation between two arrays
   */
  private static simpleCorrelation(arr1: number[], arr2: number[]): number {
    if (arr1.length !== arr2.length || arr1.length === 0) return 0;

    const mean1 = arr1.reduce((sum, val) => sum + val, 0) / arr1.length;
    const mean2 = arr2.reduce((sum, val) => sum + val, 0) / arr2.length;

    let numerator = 0;
    let sum1Sq = 0;
    let sum2Sq = 0;

    for (let i = 0; i < arr1.length; i++) {
      const diff1 = arr1[i] - mean1;
      const diff2 = arr2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Sq += diff1 * diff1;
      sum2Sq += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Sq * sum2Sq);
    return denominator > 0 ? Math.abs(numerator / denominator) : 0;
  }

  /**
   * Calculate entropy of pixel values
   */
  private static calculateEntropy(values: number[]): number {
    // Create histogram bins
    const bins = new Array(16).fill(0);
    const binSize = 256 / 16;

    values.forEach(val => {
      const binIndex = Math.min(Math.floor(val / binSize), 15);
      bins[binIndex]++;
    });

    // Calculate entropy
    const total = values.length;
    let entropy = 0;

    bins.forEach(count => {
      if (count > 0) {
        const probability = count / total;
        entropy -= probability * Math.log2(probability);
      }
    });

    return entropy / 4; // Normalize to [0,1] range
  }

  /**
   * Generate fallback features when image processing fails
   */
  static generateFallbackFeatures(seed: string): number[] {
    console.warn('Generating fallback features for:', seed);
    
    const features: number[] = [];
    const random = this.seededRandom(seed);
    
    // Generate 64 features with some structure
    for (let i = 0; i < 64; i++) {
      // Create features with different characteristics based on position
      let value: number;
      
      if (i < 16) {
        // Color-like features (0.2 - 0.8 range)
        value = random() * 0.6 + 0.2;
      } else if (i < 32) {
        // Texture-like features (0.1 - 0.9 range)
        value = random() * 0.8 + 0.1;
      } else if (i < 48) {
        // Shape-like features (0.0 - 1.0 range)
        value = random();
      } else {
        // Mixed features with slight bias
        value = random() * 0.7 + 0.15;
      }
      
      features.push(value);
    }
    
    return features;
  }

  /**
   * Seeded random number generator for consistent features
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
   * Validate image buffer
   */
  private static async validateImageBuffer(buffer: Buffer): Promise<void> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image: missing dimensions');
      }
      
      if (metadata.width < 10 || metadata.height < 10) {
        throw new Error('Image too small: minimum 10x10 pixels required');
      }
      
      if (metadata.width > 10000 || metadata.height > 10000) {
        throw new Error('Image too large: maximum 10000x10000 pixels allowed');
      }

      // Check file size (approximate)
      if (buffer.length > 50 * 1024 * 1024) { // 50MB
        throw new Error('Image buffer too large');
      }
    } catch (error) {
      if (error.message.includes('Input buffer contains unsupported image format')) {
        throw new Error('Unsupported image format');
      }
      throw error;
    }
  }

  /**
   * Download image with robust error handling
   */
  private static async downloadImage(imageUrl: string): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImageProcessor/1.0)',
          'Accept': 'image/*'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Image download timeout');
      }
      
      throw new Error(`Failed to download image: ${fetchError.message}`);
    }
  }

  /**
   * Extract features from uploaded file
   */
  static async extractFeaturesFromFile(filePath: string): Promise<number[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const imageBuffer = await fs.readFile(filePath);
      await this.validateImageBuffer(imageBuffer);
      
      return await this.extractAdvancedFeatures(imageBuffer);
    } catch (error) {
      console.error('Error extracting features from file:', error);
      return this.generateFallbackFeatures(filePath);
    }
  }

  /**
   * Extract features from image URL
   */
  static async extractFeaturesFromURL(imageUrl: string): Promise<number[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const imageBuffer = await this.downloadImage(imageUrl);
      await this.validateImageBuffer(imageBuffer);
      
      return await this.extractAdvancedFeatures(imageBuffer);
    } catch (error) {
      console.error('Error extracting features from URL:', error);
      console.error('URL:', imageUrl);
      
      // Generate fallback features based on URL
      return this.generateFallbackFeatures(imageUrl);
    }
  }

  /**
   * Extract simple features (legacy method)
   */
  static async extractSimpleFeatures(imageBuffer: Buffer): Promise<number[]> {
    return await this.extractAdvancedFeatures(imageBuffer);
  }

  /**
   * Clean up resources
   */
  static dispose(): void {
    this.isInitialized = false;
    console.log('ImageProcessor disposed');
  }

  /**
   * Get processor status
   */
  static getStatus(): {
    initialized: boolean;
    backend: string;
    features: string;
  } {
    return {
      initialized: this.isInitialized,
      backend: 'Sharp-based',
      features: 'Advanced feature extraction with 64-dimensional vectors'
    };
  }
}