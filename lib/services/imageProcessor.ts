import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';

// Conditional import for TensorFlow.js
let tf: any = null;

// Try to import TensorFlow.js only in browser environment
if (typeof window !== 'undefined') {
  import('@tensorflow/tfjs').then(module => {
    tf = module;
  }).catch(err => {
    console.warn('TensorFlow.js not available:', err);
  });
}

export class ImageProcessor {
  private static model: any = null;
  private static isInitialized = false;

  /**
   * Initialize the image processing model
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if TensorFlow.js is available
      if (!tf) {
        console.warn('TensorFlow.js not available, using fallback feature extraction');
        this.isInitialized = true;
        return;
      }

      // Set TensorFlow.js backend
      if (typeof window === 'undefined') {
        // Server-side: use CPU backend if available
        try {
          await tf.setBackend('cpu');
        } catch (error) {
          console.warn('CPU backend not available, using fallback');
          this.isInitialized = true;
          return;
        }
      } else {
        // Client-side: use WebGL backend
        await tf.setBackend('webgl');
      }

      await tf.ready();
      
      // Create a simple feature extraction model
      this.model = this.createSimpleFeatureExtractor();
      
      this.isInitialized = true;
      console.log('ImageProcessor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ImageProcessor:', error);
      // Fall back to simple feature extraction
      this.isInitialized = true;
    }
  }

  /**
   * Create a simple feature extractor model
   */
  private static createSimpleFeatureExtractor(): any {
    if (!tf) return null;

    try {
      const model = tf.sequential({
        layers: [
          tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.maxPooling2d({ poolSize: 2 }),
          tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu'
          }),
          tf.layers.globalAveragePooling2d(),
          tf.layers.dense({ units: 128, activation: 'relu' }),
          tf.layers.dense({ units: 64, activation: 'linear' }) // Feature vector
        ]
      });

      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError'
      });

      return model;
    } catch (error) {
      console.error('Error creating feature extractor:', error);
      return null;
    }
  }

  /**
   * Check if model is ready
   */
  static isModelReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  /**
   * Validate uploaded image file
   */
  static validateImageFile(file: { mimetype: string; size: number }): void {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
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
      const filename = `${timestamp}_${Math.random().toString(36).substring(7)}${extension}`;
      const filePath = path.join(uploadDir, filename);

      // Process and save image
      await sharp(buffer)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(filePath);

      return filename;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new Error('Failed to save uploaded file');
    }
  }

  /**
   * Extract features from uploaded file
   */
  static async extractFeaturesFromFile(filePath: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Load image buffer
      const imageBuffer = await fs.readFile(filePath);

      // Use TensorFlow model if available, otherwise use simple features
      if (this.model && tf) {
        const tensor = await this.preprocessImage(imageBuffer);
        const features = this.model.predict(tensor) as any;
        const featuresArray = await features.data();

        // Clean up tensors
        tensor.dispose();
        features.dispose();

        return Array.from(featuresArray);
      } else {
        // Fallback to simple feature extraction
        return await this.extractSimpleFeatures(imageBuffer);
      }
    } catch (error) {
      console.error('Error extracting features from file:', error);
      throw new Error('Failed to extract image features');
    }
  }

  /**
   * Extract features from image URL
   */
  static async extractFeaturesFromURL(imageUrl: string): Promise<number[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Use TensorFlow model if available, otherwise use simple features
      if (this.model && tf) {
        const tensor = await this.preprocessImage(buffer);
        const features = this.model.predict(tensor) as any;
        const featuresArray = await features.data();

        // Clean up tensors
        tensor.dispose();
        features.dispose();

        return Array.from(featuresArray);
      } else {
        // Fallback to simple feature extraction
        return await this.extractSimpleFeatures(buffer);
      }
    } catch (error) {
      console.error('Error extracting features from URL:', error);
      throw new Error('Failed to extract features from image URL');
    }
  }

  /**
   * Preprocess image for feature extraction
   */
  private static async preprocessImage(imageBuffer: Buffer): Promise<any> {
    if (!tf) {
      throw new Error('TensorFlow.js not available');
    }

    try {
      // Resize and normalize image using Sharp
      const processedBuffer = await sharp(imageBuffer)
        .resize(224, 224, { fit: 'cover' })
        .removeAlpha()
        .raw()
        .toBuffer();

      // Convert to tensor and normalize
      const tensor = tf.tensor3d(
        new Uint8Array(processedBuffer),
        [224, 224, 3],
        'int32'
      );

      // Normalize to [0, 1] and add batch dimension
      const normalized = tensor.cast('float32').div(255.0);
      const batched = normalized.expandDims(0);

      // Clean up intermediate tensors
      tensor.dispose();
      normalized.dispose();

      return batched;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw new Error('Failed to preprocess image');
    }
  }

  /**
   * Generate simple features for demonstration
   * This is a fallback when the full model isn't available
   */
  static async extractSimpleFeatures(imageBuffer: Buffer): Promise<number[]> {
    try {
      // Get basic image statistics using Sharp
      const stats = await sharp(imageBuffer).stats();
      const metadata = await sharp(imageBuffer).metadata();

      // Create a simple feature vector from image properties
      const features: number[] = [];

      // Add color channel means
      if (stats.channels) {
        stats.channels.forEach(channel => {
          features.push(channel.mean / 255); // Normalize to [0,1]
        });
      }

      // Add image dimensions (normalized)
      features.push((metadata.width || 0) / 1000);
      features.push((metadata.height || 0) / 1000);

      // Add aspect ratio
      const aspectRatio = metadata.width && metadata.height 
        ? metadata.width / metadata.height 
        : 1;
      features.push(aspectRatio);

      // Add more statistical features
      if (stats.channels && stats.channels.length >= 3) {
        // RGB channel statistics
        const [r, g, b] = stats.channels;
        features.push(r.std / 255); // Red std deviation
        features.push(g.std / 255); // Green std deviation  
        features.push(b.std / 255); // Blue std deviation
        features.push(r.min / 255); // Red min
        features.push(g.min / 255); // Green min
        features.push(b.min / 255); // Blue min
        features.push(r.max / 255); // Red max
        features.push(g.max / 255); // Green max
        features.push(b.max / 255); // Blue max
      }

      // Pad to 64 dimensions with derived values
      while (features.length < 64) {
        const baseIndex = features.length % (features.length || 1);
        const baseValue = features[baseIndex] || 0;
        // Create slightly varied features based on existing ones
        features.push(baseValue * 0.8 + Math.random() * 0.1);
      }

      return features.slice(0, 64); // Ensure exactly 64 features
    } catch (error) {
      console.error('Error extracting simple features:', error);
      throw new Error('Failed to extract image features');
    }
  }

  /**
   * Clean up resources
   */
  static dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isInitialized = false;
  }
}