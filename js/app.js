class VisualProductMatcherApp {
    constructor() {
        this.isInitialized = false;
        this.initializationPromise = null;
    }

    /**
     * Initialize the application
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;
        if (this.initializationPromise) return this.initializationPromise;
        
        this.initializationPromise = this._initializeAsync();
        return this.initializationPromise;
    }

    /**
     * Async initialization process
     * @private
     */
    async _initializeAsync() {
        try {
            console.log('Initializing Visual Product Matcher...');
            
            // Initialize similarity matcher
            window.similarityMatcher = new SimilarityMatcher(productDatabase, imageProcessor);
            
            // Load AI model in background
            this.loadModelInBackground();
            
            // Setup UI event listeners
            uiController.setupEventListeners();
            
            // Preload product features for better performance
            this.preloadProductFeaturesInBackground();
            
            this.isInitialized = true;
            console.log('Application initialized successfully');
            
        } catch (error) {
            console.error('Error initializing application:', error);
            uiController.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Load TensorFlow model in background
     */
    async loadModelInBackground() {
        try {
            console.log('Loading AI model...');
            const success = await imageProcessor.loadModel();
            
            if (success) {
                console.log('AI model loaded successfully');
                uiController.showSuccess('AI model loaded - enhanced matching available!');
            } else {
                console.log('Using fallback image processing');
                uiController.showSuccess('Application ready - using fallback image processing');
            }
        } catch (error) {
            console.error('Model loading error:', error);
            console.log('Continuing with fallback processing');
        }
    }

    /**
     * Preload product features in background for better performance
     */
    async preloadProductFeaturesInBackground() {
        // Wait a bit to avoid blocking initial UI
        setTimeout(async () => {
            try {
                await similarityMatcher.preloadProductFeatures();
                console.log('Product features preloaded');
            } catch (error) {
                console.error('Error preloading features:', error);
            }
        }, 2000);
    }

    /**
     * Handle application errors globally
     * @param {Error} error - Error object
     * @param {string} context - Context where error occurred
     */
    handleError(error, context = 'Unknown') {
        console.error(`Application error in ${context}:`, error);
        
        const userMessage = this.getUserFriendlyErrorMessage(error);
        uiController.showError(userMessage);
        
        // Could implement error reporting here
        this.reportError(error, context);
    }

    /**
     * Convert technical errors to user-friendly messages
     * @param {Error} error - Error object
     * @returns {string} User-friendly message
     */
    getUserFriendlyErrorMessage(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch')) {
            return 'Network error. Please check your internet connection.';
        }
        
        if (message.includes('cors') || message.includes('cross-origin')) {
            return 'Unable to access image. Please try uploading the file directly.';
        }
        
        if (message.includes('model') || message.includes('tensorflow')) {
            return 'AI processing error. Using fallback method.';
        }
        
        if (message.includes('file') || message.includes('image')) {
            return 'Invalid image file. Please try a different image.';
        }
        
        return 'An unexpected error occurred. Please try again.';
    }

    /**
     * Report error for monitoring (placeholder for analytics)
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    reportError(error, context) {
        // In a real application, this would send to analytics/monitoring service
        const errorReport = {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.log('Error report:', errorReport);
        // Example: analytics.track('application_error', errorReport);
    }

    /**
     * Get application status and statistics
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            modelLoaded: imageProcessor.isModelReady(),
            productCount: productDatabase.getProductCount(),
            cacheStats: similarityMatcher ? similarityMatcher.getCacheStats() : null,
            currentResults: uiController.currentResults.length,
            hasUploadedImage: !!uiController.uploadedImageFeatures
        };
    }

    /**
     * Clear application state (useful for testing)
     */
    reset() {
        uiController.currentResults = [];
        uiController.uploadedImageFeatures = null;
        uiController.elements.previewSection.style.display = 'none';
        uiController.elements.resultsSection.style.display = 'none';
        uiController.resetFilters();
        uiController.clearErrors();
        
        if (similarityMatcher) {
            similarityMatcher.clearCache();
        }
        
        console.log('Application state reset');
    }

    /**
     * Enable debug mode with additional logging
     */
    enableDebugMode() {
        window.debug = true;
        console.log('Debug mode enabled');
        
        // Add debug panel to UI
        this.createDebugPanel();
    }

    /**
     * Create debug panel for development
     */
    createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debugPanel';
        debugPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
            max-width: 300px;
        `;
        
        debugPanel.innerHTML = `
            <h4>Debug Panel</h4>
            <div id="debugContent">Loading...</div>
            <button onclick="app.updateDebugInfo()" style="margin-top: 10px; padding: 5px 10px;">Refresh</button>
        `;
        
        document.body.appendChild(debugPanel);
        this.updateDebugInfo();
        
        // Update debug info every 5 seconds
        setInterval(() => this.updateDebugInfo(), 5000);
    }

    /**
     * Update debug panel information
     */
    updateDebugInfo() {
        const debugContent = document.getElementById('debugContent');
        if (!debugContent) return;
        
        const status = this.getStatus();
        debugContent.innerHTML = `
            <div>Model: ${status.modelLoaded ? '✅' : '❌'}</div>
            <div>Products: ${status.productCount}</div>
            <div>Cache: ${status.cacheStats ? status.cacheStats.size : 0}/${status.productCount}</div>
            <div>Results: ${status.currentResults}</div>
            <div>Image: ${status.hasUploadedImage ? '✅' : '❌'}</div>
        `;
    }
}

/**
 * Application Configuration
 */
const APP_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    SUPPORTED_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    DEFAULT_SIMILARITY_THRESHOLD: 0.3,
    MAX_RESULTS: 50,
    BATCH_SIZE: 5,
    DEBUG_MODE: false
};

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.app) {
        app.handleError(event.error, 'Global');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.app) {
        app.handleError(new Error(event.reason), 'Promise');
    }
});

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Create global app instance
        window.app = new VisualProductMatcherApp();
        
        // Initialize application
        await app.initialize();
        
        // Enable debug mode if needed
        if (APP_CONFIG.DEBUG_MODE || window.location.search.includes('debug=true')) {
            app.enableDebugMode();
        }
        
        console.log('Visual Product Matcher is ready!');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <h2>Application Failed to Load</h2>
                <p>Please refresh the page and try again.</p>
                <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px;">
                    Refresh Page
                </button>
            </div>
        `;
    }
});

// Expose utility functions for debugging
if (typeof window !== 'undefined') {
    window.getAppStatus = () => app ? app.getStatus() : 'App not initialized';
    window.resetApp = () => app ? app.reset() : console.log('App not initialized');
    window.enableDebug = () => app ? app.enableDebugMode() : console.log('App not initialized');
}