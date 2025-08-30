# Visual Product Matcher

A web application that helps users find visually similar products using AI-powered image analysis. Upload an image and discover products with similar visual characteristics from our curated database.

## 🚀 Live Demo

[Insert your deployed URL here]

## 📋 Features

- **Image Upload**: Support for file upload and image URL input
- **AI-Powered Matching**: Uses TensorFlow.js with MobileNet for deep feature extraction
- **Smart Filtering**: Filter results by category and similarity threshold
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Real-time Processing**: Fast image analysis with loading states
- **Product Database**: 50+ products across Electronics, Home & Garden, Kitchen, and Furniture

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **AI/ML**: TensorFlow.js with pre-trained MobileNet model
- **Image Processing**: Canvas API for fallback feature extraction
- **Architecture**: Modular component-based structure
- **Styling**: Custom CSS with modern gradient design
- **Hosting**: Static hosting compatible (Vercel, Netlify, GitHub Pages)

## 📁 Project Structure

```
visual-product-matcher/
├── index.html                 # Main HTML file
├── styles.css                 # Global styles and responsive design
├── js/
│   ├── app.js                # Main application controller
│   ├── productDatabase.js    # Product data management
│   ├── imageProcessor.js     # Image processing and ML
│   ├── similarityMatcher.js  # Similarity algorithms
│   └── uiController.js       # UI interactions and events
└── README.md                 # This documentation
```

## 🏗️ Architecture Overview

### Component Breakdown

1. **ProductDatabase** (`productDatabase.js`)
   - Manages the product catalog
   - Provides filtering and search capabilities
   - Handles data validation and CRUD operations

2. **ImageProcessor** (`imageProcessor.js`) 
   - Loads and initializes TensorFlow.js models
   - Extracts deep features using MobileNet
   - Provides fallback canvas-based feature extraction
   - Handles image validation and preprocessing

3. **SimilarityMatcher** (`similarityMatcher.js`)
   - Implements cosine similarity and Euclidean distance algorithms
   - Manages feature caching for performance
   - Handles batch processing and ranking

4. **UIController** (`uiController.js`)
   - Manages all user interface interactions
   - Handles drag & drop, file uploads, and URL inputs
   - Controls loading states and error messages
   - Renders search results and filters

5. **VisualProductMatcherApp** (`app.js`)
   - Main application orchestrator
   - Coordinates all components
   - Manages application lifecycle and error handling
   - Provides debugging and monitoring capabilities

## 🧠 Technical Approach

### Feature Extraction Pipeline
1. **Image Preprocessing**: Resize to 224x224, normalize pixel values (0-1)
2. **Primary Method**: MobileNet v1 (0.25 width multiplier) for 1024-dimensional features
3. **Fallback Method**: Canvas-based color histograms, edge detection, and texture analysis
4. **Caching**: Features cached in memory for performance optimization

### Similarity Matching
- **Algorithm**: Cosine similarity between feature vectors
- **Alternative**: Euclidean distance with similarity conversion
- **Ranking**: Products sorted by similarity score (highest first)
- **Performance**: Batch processing with configurable limits

### Error Handling Strategy
- **Graceful Degradation**: Falls back to simpler methods when ML fails
- **User-Friendly Messages**: Technical errors converted to readable feedback
- **Global Handlers**: Catches unhandled errors and promise rejections
- **Retry Logic**: Automatic fallbacks for network and processing errors

## 🚀 Quick Start

### Local Development
1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd visual-product-matcher
   ```

2. Serve with a local server (required for CORS):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. Navigate to `http://localhost:8000`

### Deployment
Deploy as static files to any hosting service:

```bash
# Vercel
vercel --prod

# Netlify CLI
netlify deploy --prod --dir .

# GitHub Pages
# Push to gh-pages branch or enable Pages in settings
```

## 🔧 Configuration

### Adding Products
Edit `js/productDatabase.js`:

```javascript
// Add to the products array in ProductDatabase constructor
{
    id: 51,
    name: "Your Product Name",
    category: "Electronics", // Electronics, Home & Garden, Kitchen, Furniture
    image: "https://your-image-url.jpg",
    price: "$XX.XX"
}
```

### Customizing Similarity Algorithm
Modify `js/similarityMatcher.js`:

```javascript
// Switch between cosine similarity and Euclidean distance
const results = await similarityMatcher.findSimilarProducts(features, {
    method: 'cosine', // or 'euclidean'
    minSimilarity: 0.3,
    maxResults: 20
});
```

### UI Customization
Update `styles.css` for visual changes:
- Color scheme: Modify CSS custom properties
- Layout: Adjust grid templates and spacing
- Animations: Customize transition timings

## 📊 Performance Optimization

### Model Loading
- **Lazy Loading**: Model loads asynchronously after UI initialization
- **Fallback Ready**: Application works immediately with canvas processing
- **Memory Management**: Proper tensor disposal prevents memory leaks

### Feature Caching
- **Smart Caching**: Product features cached after first extraction
- **Batch Processing**: Processes multiple products efficiently
- **Memory Monitoring**: Cache statistics available via debug mode

### Image Processing
- **Progressive Enhancement**: Starts with simple features, upgrades to ML
- **Size Limits**: 10MB file size limit with validation
- **Format Support**: JPEG, PNG, WebP with error handling

## 🐛 Debugging

### Enable Debug Mode
Add `?debug=true` to URL or call in console:
```javascript
app.enableDebugMode();
```

### Useful Debug Commands
```javascript
// Get application status
getAppStatus()

// Reset application state
resetApp()

// Check model status
imageProcessor.isModelReady()

// View cache statistics
similarityMatcher.getCacheStats()

// Clear feature cache
similarityMatcher.clearCache()
```

### Common Issues
1. **Model Loading Fails**: Application continues with fallback processing
2. **CORS Errors**: Use file upload instead of URL for local images
3. **Performance Issues**: Clear cache or reduce batch size
4. **Memory Leaks**: Check browser dev tools for tensor disposal

## 📈 Similarity Scoring

### Score Interpretation
- **90%+**: Nearly identical products
- **70-90%**: Very similar visual characteristics
- **50-70%**: Moderately similar
- **30-50%**: Some visual similarities
- **<30%**: Different visual characteristics

### Factors Affecting Similarity
- **Color Distribution**: Primary and secondary colors
- **Shape and Edges**: Object boundaries and geometric features
- **Texture Patterns**: Surface characteristics and patterns
- **Object Composition**: Layout and spatial relationships

## 🔮 Future Enhancements

### Planned Features
- **Advanced Filters**: Price range, brand, ratings
- **User Features**: Favorites, search history, user accounts
- **Enhanced ML**: Custom trained models for product categories
- **API Integration**: Real product data from e-commerce APIs
- **Mobile App**: Native mobile application

### Performance Improvements
- **WebWorkers**: Move ML processing to background threads
- **IndexedDB**: Persistent client-side feature caching
- **CDN Integration**: Faster image loading and model serving
- **Progressive Web App**: Offline functionality and app-like experience

## 📄 License

This project is created as a technical assessment and is available for evaluation purposes.

## 🧪 Testing

### Manual Testing Checklist
- [ ] File upload works with various image formats
- [ ] URL input handles valid and invalid URLs
- [ ] Drag and drop functionality works
- [ ] Filters work correctly
- [ ] Mobile responsiveness
- [ ] Error handling for network issues
- [ ] Loading states display properly

### Performance Testing
```javascript
// Measure feature extraction time
console.time('featureExtraction');
await imageProcessor.extractFeatures(imageElement);
console.timeEnd('featureExtraction');

// Measure similarity calculation time
console.time('similarityMatching');
await similarityMatcher.findSimilarProducts(features);
console.timeEnd('similarityMatching');
```

## 📞 Contact

For questions about this implementation, please refer to the technical assessment guidelines.

---

**Development Time**: ~6 hours  
**Key Focus**: Clean architecture, working functionality, user experience  
**Lines of Code**: ~800 (well-structured and documented)