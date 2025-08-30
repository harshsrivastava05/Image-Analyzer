class UIController {
    constructor() {
        this.currentResults = [];
        this.uploadedImageFeatures = null;
        this.elements = {};
        this.initializeElements();
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        this.elements = {
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            urlInput: document.getElementById('urlInput'),
            urlBtn: document.getElementById('urlBtn'),
            previewSection: document.getElementById('previewSection'),
            previewImage: document.getElementById('previewImage'),
            findSimilarBtn: document.getElementById('findSimilarBtn'),
            resultsSection: document.getElementById('resultsSection'),
            loadingDiv: document.getElementById('loadingDiv'),
            resultsGrid: document.getElementById('resultsGrid'),
            categoryFilter: document.getElementById('categoryFilter'),
            similarityFilter: document.getElementById('similarityFilter')
        };
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Upload area interactions
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        // Drag and drop functionality
        this.setupDragAndDrop();

        // URL input handling
        this.elements.urlBtn.addEventListener('click', () => {
            this.handleURLInput();
        });

        this.elements.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleURLInput();
            }
        });

        // Find similar button
        this.elements.findSimilarBtn.addEventListener('click', () => {
            this.processImage();
        });

        // Filter controls
        this.elements.categoryFilter.addEventListener('change', () => {
            this.applyFilters();
        });

        this.elements.similarityFilter.addEventListener('change', () => {
            this.applyFilters();
        });
    }

    /**
     * Setup drag and drop functionality
     */
    setupDragAndDrop() {
        const uploadArea = this.elements.uploadArea;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            if (!uploadArea.contains(e.relatedTarget)) {
                uploadArea.classList.remove('dragover');
            }
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files[0]);
        });
    }

    /**
     * Handle file upload
     * @param {File} file - Uploaded file
     */
    async handleFileUpload(file) {
        try {
            if (!file) return;
            
            // Validate file
            imageProcessor.validateImageFile(file);
            
            // Convert to data URL and display preview
            const dataURL = await imageProcessor.fileToDataURL(file);
            this.displayPreview(dataURL);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * Handle URL input
     */
    handleURLInput() {
        const url = this.elements.urlInput.value.trim();
        
        if (!url) {
            this.showError('Please enter a valid image URL');
            return;
        }
        
        if (!this.isValidURL(url)) {
            this.showError('Please enter a valid URL');
            return;
        }
        
        this.displayPreview(url);
    }

    /**
     * Validate URL format
     * @param {string} url - URL to validate
     * @returns {boolean} Validation result
     */
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Display image preview
     * @param {string} imageSrc - Image source URL or data URL
     */
    displayPreview(imageSrc) {
        this.elements.previewImage.src = imageSrc;
        this.elements.previewSection.style.display = 'block';
        this.elements.resultsSection.style.display = 'none';
        
        // Clear any existing error messages
        this.clearErrors();
    }

    /**
     * Process uploaded image and find similar products
     */
    async processImage() {
        try {
            // Show loading state
            this.showLoading();
            
            // Load and process the uploaded image
            const uploadedImage = await imageProcessor.loadImage(this.elements.previewImage.src);
            this.uploadedImageFeatures = await imageProcessor.extractFeatures(uploadedImage);
            
            // Find similar products
            this.currentResults = await similarityMatcher.findSimilarProducts(
                this.uploadedImageFeatures
            );
            
            // Display results
            this.hideLoading();
            this.displayResults(this.currentResults);
            
        } catch (error) {
            console.error('Error processing image:', error);
            this.hideLoading();
            this.showError('Error processing image. Please try again.');
        }
    }

    /**
     * Display search results
     * @param {Array} results - Array of products with similarity scores
     */
    displayResults(results) {
        const grid = this.elements.resultsGrid;
        grid.innerHTML = '';
        
        if (results.length === 0) {
            this.displayNoResults();
            return;
        }
        
        results.forEach(product => {
            const card = this.createProductCard(product);
            grid.appendChild(card);
        });
    }

    /**
     * Create a product card element
     * @param {Object} product - Product object with similarity score
     * @returns {HTMLElement} Product card element
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image}" 
                 alt="${product.name}" 
                 class="product-image" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=Image+Not+Found'"
                 loading="lazy">
            <div class="product-info">
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-category">${this.escapeHtml(product.category)}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <span style="font-weight: 600; color: #333;">${this.escapeHtml(product.price)}</span>
                    <span class="similarity-score">${product.matchScore}% match</span>
                </div>
            </div>
        `;
        
        // Add click handler for product details (future enhancement)
        card.addEventListener('click', () => {
            console.log('Product clicked:', product.name);
            // Could implement product detail modal here
        });
        
        return card;
    }

    /**
     * Display no results message
     */
    displayNoResults() {
        const grid = this.elements.resultsGrid;
        grid.innerHTML = `
            <div style="text-align: center; color: #666; grid-column: 1/-1; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters or uploading a different image.</p>
            </div>
        `;
    }

    /**
     * Apply filters to current results
     */
    applyFilters() {
        if (!this.currentResults.length) return;
        
        const categoryFilter = this.elements.categoryFilter.value;
        const similarityFilter = parseFloat(this.elements.similarityFilter.value);
        
        let filtered = [...this.currentResults];
        
        // Apply category filter
        if (categoryFilter) {
            filtered = filtered.filter(product => product.category === categoryFilter);
        }
        
        // Apply similarity filter
        if (similarityFilter > 0) {
            filtered = filtered.filter(product => product.similarity >= similarityFilter);
        }
        
        this.displayResults(filtered);
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.elements.resultsSection.style.display = 'block';
        this.elements.loadingDiv.style.display = 'block';
        this.elements.resultsGrid.innerHTML = '';
        this.elements.findSimilarBtn.disabled = true;
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.elements.loadingDiv.style.display = 'none';
        this.elements.findSimilarBtn.disabled = false;
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        this.clearErrors();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.appendChild(errorDiv);
        
        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Clear existing error messages
     */
    clearErrors() {
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Reset filters to default state
     */
    resetFilters() {
        this.elements.categoryFilter.value = '';
        this.elements.similarityFilter.value = '0';
    }

    /**
     * Get current filter state
     * @returns {Object} Current filter values
     */
    getCurrentFilters() {
        return {
            category: this.elements.categoryFilter.value,
            similarity: parseFloat(this.elements.similarityFilter.value)
        };
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background: #efe; 
            border: 1px solid #cfc; 
            color: #060; 
            padding: 15px; 
            border-radius: 8px; 
            margin: 20px 0;
        `;
        successDiv.textContent = message;
        
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.appendChild(successDiv);
        
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// Initialize global UI controller instance
const uiController = new UIController();