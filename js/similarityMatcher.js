class SimilarityMatcher {
    constructor(productDatabase, imageProcessor) {
        this.productDatabase = productDatabase;
        this.imageProcessor = imageProcessor;
        this.productFeatureCache = new Map();
    }

    /**
     * Calculate cosine similarity between two feature vectors
     * @param {Array} vectorA - First feature vector
     * @param {Array} vectorB - Second feature vector
     * @returns {number} Similarity score (0-1)
     */
    cosineSimilarity(vectorA, vectorB) {
        if (vectorA.length !== vectorB.length) {
            console.warn('Feature vectors have different lengths');
            return 0;
        }
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }
        
        if (normA === 0 || normB === 0) {
            return 0;
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Calculate Euclidean distance between vectors
     * @param {Array} vectorA - First feature vector
     * @param {Array} vectorB - Second feature vector
     * @returns {number} Distance score
     */
    euclideanDistance(vectorA, vectorB) {
        if (vectorA.length !== vectorB.length) return Infinity;
        
        let sum = 0;
        for (let i = 0; i < vectorA.length; i++) {
            sum += Math.pow(vectorA[i] - vectorB[i], 2);
        }
        
        return Math.sqrt(sum);
    }

    /**
     * Extract features for a product image with caching
     * @param {Object} product - Product object
     * @returns {Promise<Array>} Feature vector
     */
    async getProductFeatures(product) {
        // Check cache first
        if (this.productFeatureCache.has(product.id)) {
            return this.productFeatureCache.get(product.id);
        }

        try {
            const img = await this.imageProcessor.loadImage(product.image);
            const features = await this.imageProcessor.extractFeatures(img);
            
            // Cache the features for future use
            this.productFeatureCache.set(product.id, features);
            return features;
        } catch (error) {
            console.error(`Error extracting features for product ${product.id}:`, error);
            // Return random features as fallback
            const fallbackFeatures = this.generateFallbackFeatures();
            this.productFeatureCache.set(product.id, fallbackFeatures);
            return fallbackFeatures;
        }
    }

    /**
     * Generate fallback features when image processing fails
     * @returns {Array} Random feature vector
     */
    generateFallbackFeatures() {
        const features = [];
        for (let i = 0; i < 50; i++) {
            features.push(Math.random() * 0.5 + 0.25); // Random values between 0.25-0.75
        }
        return features;
    }

    /**
     * Find similar products to uploaded image
     * @param {Array} uploadedFeatures - Feature vector of uploaded image
     * @param {Object} options - Matching options
     * @returns {Promise<Array>} Array of products with similarity scores
     */
    async findSimilarProducts(uploadedFeatures, options = {}) {
        const {
            categoryFilter = null,
            minSimilarity = 0,
            maxResults = 50,
            method = 'cosine' // 'cosine' or 'euclidean'
        } = options;

        const products = this.productDatabase.getAllProducts();
        const similarities = [];

        // Process each product
        for (const product of products) {
            try {
                // Apply category filter early
                if (categoryFilter && product.category !== categoryFilter) {
                    continue;
                }

                const productFeatures = await this.getProductFeatures(product);
                let similarity;

                if (method === 'euclidean') {
                    const distance = this.euclideanDistance(uploadedFeatures, productFeatures);
                    // Convert distance to similarity score (0-1)
                    similarity = 1 / (1 + distance);
                } else {
                    similarity = this.cosineSimilarity(uploadedFeatures, productFeatures);
                }

                // Apply minimum similarity filter
                if (similarity >= minSimilarity) {
                    similarities.push({
                        ...product,
                        similarity: similarity,
                        matchScore: Math.round(similarity * 100)
                    });
                }
            } catch (error) {
                console.error(`Error processing product ${product.id}:`, error);
                // Skip this product if processing fails
                continue;
            }
        }

        // Sort by similarity (highest first) and limit results
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults);
    }

    /**
     * Batch process all products for faster subsequent searches
     * @returns {Promise<void>}
     */
    async preloadProductFeatures() {
        const products = this.productDatabase.getAllProducts();
        const batchSize = 5;
        
        console.log(`Preloading features for ${products.length} products...`);
        
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            const promises = batch.map(product => this.getProductFeatures(product));
            
            try {
                await Promise.all(promises);
                console.log(`Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(products.length/batchSize)}`);
            } catch (error) {
                console.error('Error in batch processing:', error);
            }
            
            // Small delay to prevent overwhelming the browser
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('Feature preloading completed');
    }

    /**
     * Get similarity statistics for debugging
     * @param {Array} results - Array of similarity results
     * @returns {Object} Statistics object
     */
    getSimilarityStats(results) {
        if (results.length === 0) {
            return { min: 0, max: 0, avg: 0, count: 0 };
        }

        const scores = results.map(r => r.similarity);
        return {
            min: Math.min(...scores),
            max: Math.max(...scores),
            avg: scores.reduce((a, b) => a + b, 0) / scores.length,
            count: results.length
        };
    }

    /**
     * Clear feature cache to free memory
     */
    clearCache() {
        this.productFeatureCache.clear();
        console.log('Feature cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getCacheStats() {
        return {
            size: this.productFeatureCache.size,
            totalProducts: this.productDatabase.getProductCount(),
            cacheRatio: this.productFeatureCache.size / this.productDatabase.getProductCount()
        };
    }
}

// Initialize global similarity matcher instance
let similarityMatcher;