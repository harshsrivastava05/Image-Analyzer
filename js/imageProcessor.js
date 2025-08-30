class ImageProcessor {
    constructor() {
        this.model = null;
        this.isModelLoading = false;
        this.modelLoaded = false;
    }

    /**
     * Initialize and load TensorFlow model
     * @returns {Promise<boolean>} Success status
     */
    async loadModel() {
        if (this.modelLoaded || this.isModelLoading) {
            return this.modelLoaded;
        }

        this.isModelLoading = true;
        
        try {
            console.log('Loading MobileNet model...');
            this.model = await tf.loadLayersModel(
                'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
            );
            this.modelLoaded = true;
            console.log('MobileNet model loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            this.modelLoaded = false;
            return false;
        } finally {
            this.isModelLoading = false;
        }
    }

    /**
     * Extract features from image using neural network
     * @param {HTMLImageElement} imageElement - Image element to process
     * @returns {Promise<Array>} Feature vector array
     */
    async extractFeatures(imageElement) {
        try {
            if (!this.modelLoaded) {
                console.log('Model not loaded, using fallback method');
                return await this.extractSimpleFeatures(imageElement);
            }

            // Preprocess image for MobileNet
            const tensor = tf.browser.fromPixels(imageElement)
                .resizeNearestNeighbor([224, 224])
                .toFloat()
                .div(tf.scalar(255.0))
                .expandDims();

            // Extract features using the model
            const prediction = this.model.predict(tensor);
            const features = await prediction.data();
            
            // Clean up tensors to prevent memory leaks
            tensor.dispose();
            prediction.dispose();
            
            return Array.from(features);
        } catch (error) {
            console.error('Error extracting features with model:', error);
            return await this.extractSimpleFeatures(imageElement);
        }
    }

    /**
     * Fallback feature extraction using canvas analysis
     * @param {HTMLImageElement} imageElement - Image element to process
     * @returns {Promise<Array>} Simple feature vector
     */
    async extractSimpleFeatures(imageElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        
        // Draw and analyze image
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        const features = this.calculateImageFeatures(data);
        return features;
    }

    /**
     * Calculate various image features for similarity matching
     * @param {Uint8ClampedArray} imageData - Raw image pixel data
     * @returns {Array} Feature vector
     */
    calculateImageFeatures(data) {
        const features = [];
        const pixelCount = data.length / 4;
        
        // Color features
        let totalR = 0, totalG = 0, totalB = 0;
        let rHist = new Array(16).fill(0);
        let gHist = new Array(16).fill(0);
        let bHist = new Array(16).fill(0);
        
        // Texture features
        let edges = 0;
        let contrast = 0;
        let brightness = 0;
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Color statistics
            totalR += r;
            totalG += g;
            totalB += b;
            
            // Color histograms
            rHist[Math.floor(r / 16)]++;
            gHist[Math.floor(g / 16)]++;
            bHist[Math.floor(b / 16)]++;
            
            // Brightness
            brightness += (r + g + b) / 3;
            
            // Simple edge detection
            if (i > 400 && i < data.length - 400) {
                const diff = Math.abs(r - data[i - 400]) + 
                            Math.abs(g - data[i - 399]) + 
                            Math.abs(b - data[i - 398]);
                if (diff > 100) edges++;
                contrast += diff;
            }
        }
        
        // Normalize and add basic features
        features.push(totalR / pixelCount / 255); // Average red
        features.push(totalG / pixelCount / 255); // Average green
        features.push(totalB / pixelCount / 255); // Average blue
        features.push(edges / pixelCount);        // Edge density
        features.push(brightness / pixelCount / 255); // Average brightness
        features.push(contrast / pixelCount / 255);   // Average contrast
        
        // Add normalized color histograms
        rHist.forEach(val => features.push(val / pixelCount));
        gHist.forEach(val => features.push(val / pixelCount));
        bHist.forEach(val => features.push(val / pixelCount));
        
        return features;
    }

    /**
     * Validate and preprocess image
     * @param {string} imageSrc - Image source (URL or data URL)
     * @returns {Promise<HTMLImageElement>} Processed image element
     */
    async loadImage(imageSrc) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Validate image dimensions
                if (img.width < 50 || img.height < 50) {
                    reject(new Error('Image too small (minimum 50x50 pixels)'));
                    return;
                }
                resolve(img);
            };
            
            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };
            
            img.src = imageSrc;
        });
    }

    /**
     * Validate file type and size
     * @param {File} file - File to validate
     * @returns {boolean} Validation result
     */
    validateImageFile(file) {
        // Check file type
        if (!file.type.startsWith('image/')) {
            throw new Error('Please select a valid image file');
        }
        
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('Image file too large (max 10MB)');
        }
        
        return true;
    }

    /**
     * Convert file to data URL
     * @param {File} file - Image file
     * @returns {Promise<string>} Data URL string
     */
    async fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = e => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Get model loading status
     * @returns {boolean} Whether model is loaded
     */
    isModelReady() {
        return this.modelLoaded;
    }
}

// Initialize global image processor instance
const imageProcessor = new ImageProcessor();