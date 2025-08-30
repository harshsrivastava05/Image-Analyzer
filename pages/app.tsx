import { useState, useEffect } from 'react';
import Head from 'next/head';
import { AlertCircle, CheckCircle, Search, Settings, BarChart3 } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { SearchFilters } from '../components/SearchFilters';
import { ProductGrid } from '../components/ProductGrid';
import { useImageUpload } from '../hooks/useImageUpload';
import { useProductSearch } from '../hooks/useProductSearch';
import { SearchResult } from '../lib/database';

export default function App() {
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    minSimilarity: 0
  });
  const [activeTab, setActiveTab] = useState<'search' | 'analytics'>('search');

  // Custom hooks
  const imageUpload = useImageUpload();
  const productSearch = useProductSearch();

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    await imageUpload.uploadFile(file);
  };

  const handleUrlUpload = async (url: string) => {
    await imageUpload.uploadFromUrl(url);
  };

  const handleProductClick = (product: SearchResult) => {
    console.log('Product clicked:', product);
    // Future: Open product detail modal or navigate to product page
  };

  const findSimilarProducts = async () => {
    if (!imageUpload.state.features) {
      return;
    }

    await productSearch.searchProducts(imageUpload.state.features, {
      categoryFilter: filters.category || undefined,
      minSimilarity: filters.minSimilarity,
      maxResults: 50,
      method: 'cosine'
    });
  };

  // Auto-search when image is uploaded
  useEffect(() => {
    if (imageUpload.state.features && imageUpload.state.features.length > 0) {
      findSimilarProducts();
    }
  }, [imageUpload.state.features]);

  // Filter results on client side for real-time filtering
  const filteredResults = productSearch.state.results.filter(product => {
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    if (product.similarity < filters.minSimilarity) {
      return false;
    }
    return true;
  });

  return (
    <>
      <Head>
        <title>Visual Product Matcher - Advanced App</title>
        <meta name="description" content="Advanced AI-powered visual product matching application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation Header */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">
                  Visual Product Matcher
                </h1>
                <div className="hidden sm:flex space-x-4">
                  <button
                    onClick={() => setActiveTab('search')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'search'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Search className="w-4 h-4 inline mr-1" />
                    Search
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'analytics'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 inline mr-1" />
                    Analytics
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Error Messages */}
          {(imageUpload.state.error || productSearch.state.error) && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{imageUpload.state.error || productSearch.state.error}</span>
              <button 
                onClick={() => {
                  imageUpload.clearError();
                  productSearch.clearError();
                }}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Success Messages */}
          {imageUpload.state.success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{imageUpload.state.success}</span>
            </div>
          )}

          {activeTab === 'search' && (
            <>
              {/* Upload Section */}
              <section className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                <h2 className="text-lg font-semibold mb-6 text-gray-900">
                  Upload Product Image
                </h2>
                <ImageUpload
                  onImageUpload={handleImageUpload}
                  onUrlUpload={handleUrlUpload}
                  isLoading={imageUpload.state.isLoading}
                  disabled={imageUpload.state.isLoading || productSearch.state.isLoading}
                />
              </section>

              {/* Preview Section */}
              {imageUpload.state.uploadedImage && (
                <section className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                  <h2 className="text-lg font-semibold mb-6 text-gray-900">
                    Uploaded Image
                  </h2>
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-1/3">
                      <div className="relative">
                        <img
                          src={imageUpload.state.uploadedImage}
                          alt="Uploaded image"
                          className="w-full max-w-sm rounded-lg shadow-md"
                        />
                        {imageUpload.state.isLoading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="loading-spinner mx-auto mb-2"></div>
                              <p className="text-sm">Processing...</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="lg:w-2/3">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2">Processing Status</h3>
                          <div className="flex items-center space-x-2">
                            {imageUpload.state.features ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <span className="text-sm text-gray-600">
                                  Features extracted ({imageUpload.state.features.length} dimensions)
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="loading-spinner"></div>
                                <span className="text-sm text-gray-600">Extracting features...</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {imageUpload.state.features && !imageUpload.state.isLoading && (
                          <div>
                            <button
                              onClick={findSimilarProducts}
                              disabled={productSearch.state.isLoading}
                              className="btn-primary flex items-center"
                            >
                              {productSearch.state.isLoading ? (
                                <>
                                  <div className="loading-spinner mr-2"></div>
                                  Searching...
                                </>
                              ) : (
                                <>
                                  <Search className="w-4 h-4 mr-2" />
                                  Find Similar Products
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Results Section */}
              {(productSearch.state.results.length > 0 || (imageUpload.state.uploadedImage && !imageUpload.state.isLoading)) && (
                <section className="bg-white rounded-xl shadow-sm border p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Similar Products
                      {filteredResults.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          ({filteredResults.length} found)
                        </span>
                      )}
                    </h2>
                    
                    {productSearch.state.stats && (
                      <div className="text-sm text-gray-600">
                        Avg similarity: {(productSearch.state.stats.avg * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  
                  {/* Search Filters */}
                  {productSearch.state.results.length > 0 && (
                    <SearchFilters
                      categories={categories}
                      filters={filters}
                      onFiltersChange={setFilters}
                      onReset={() => {
                        setFilters({ category: '', minSimilarity: 0 });
                        productSearch.clearError();
                      }}
                    />
                  )}

                  {/* Product Grid */}
                  <ProductGrid
                    products={filteredResults}
                    isLoading={productSearch.state.isLoading}
                    onProductClick={handleProductClick}
                  />
                </section>
              )}
            </>
          )}

          {activeTab === 'analytics' && (
            <section className="bg-white rounded-xl shadow-sm border p-8">
              <h2 className="text-lg font-semibold mb-6 text-gray-900">
                Analytics Dashboard
              </h2>
              
              {productSearch.state.stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {productSearch.state.stats.total}
                    </div>
                    <div className="text-sm text-gray-600">Total Results</div>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {(productSearch.state.stats.max * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Best Match</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {(productSearch.state.stats.avg * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Average Match</div>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Object.keys(productSearch.state.stats.categories).length}
                    </div>
                    <div className="text-sm text-gray-600">Categories Found</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Analytics Data
                  </h3>
                  <p className="text-gray-600">
                    Upload an image and perform a search to see analytics.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}