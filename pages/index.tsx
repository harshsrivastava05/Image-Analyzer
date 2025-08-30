import { useState, useEffect } from 'react';
import Head from 'next/head';
import { AlertCircle, CheckCircle, Search } from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';
import { SearchFilters } from '../components/SearchFilters';
import { ProductGrid } from '../components/ProductGrid';
import { useImageUpload } from '../hooks/useImageUpload';
import { useProductSearch } from '../hooks/useProductSearch';
import { SearchResult } from '../lib/database';

export default function Home() {
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    category: '',
    minSimilarity: 0
  });

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
        <title>Visual Product Matcher - AI-Powered Image Search</title>
        <meta name="description" content="Find similar products using AI-powered image analysis" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          
          {/* Header */}
          <header className="text-center mb-12 text-white">
            <h1 className="text-4xl md:text-5xl font-light mb-4">
              Visual Product Matcher
            </h1>
            <p className="text-xl opacity-90">
              Find similar products using AI-powered image analysis
            </p>
          </header>

          {/* Error Messages */}
          {(imageUpload.state.error || productSearch.state.error) && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
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
            <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>{imageUpload.state.success}</span>
            </div>
          )}

          {/* Upload Section */}
          <section className="bg-white rounded-2xl shadow-2xl p-8 mb-8 animate-slide-up">
            <ImageUpload
              onImageUpload={handleImageUpload}
              onUrlUpload={handleUrlUpload}
              isLoading={imageUpload.state.isLoading}
              disabled={imageUpload.state.isLoading || productSearch.state.isLoading}
            />
          </section>

          {/* Preview Section */}
          {imageUpload.state.uploadedImage && (
            <section className="bg-white rounded-2xl shadow-2xl p-8 mb-8 animate-slide-up">
              <h3 className="text-xl font-semibold mb-6">Uploaded Image</h3>
              <div className="text-center">
                <div className="relative inline-block">
                  <img
                    src={imageUpload.state.uploadedImage}
                    alt="Uploaded image"
                    className="max-w-xs max-h-80 rounded-lg shadow-lg"
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
                
                {imageUpload.state.features && !imageUpload.state.isLoading && (
                  <div className="mt-6">
                    <button
                      onClick={findSimilarProducts}
                      disabled={productSearch.state.isLoading}
                      className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center mx-auto shadow-lg hover:shadow-xl"
                    >
                      {productSearch.state.isLoading ? (
                        <>
                          <div className="loading-spinner mr-2"></div>
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 mr-2" />
                          Find Similar Products
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Results Section */}
          {(productSearch.state.results.length > 0 || (imageUpload.state.uploadedImage && !imageUpload.state.isLoading)) && (
            <section className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">
                  Similar Products
                  {filteredResults.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      ({filteredResults.length} found)
                    </span>
                  )}
                </h3>
                
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

              {/* Results Summary */}
              {filteredResults.length > 0 && productSearch.state.stats && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="font-semibold text-lg text-gray-900">
                        {filteredResults.length}
                      </div>
                      <div className="text-sm text-gray-600">Results</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900">
                        {(productSearch.state.stats.max * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Best Match</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900">
                        {(productSearch.state.stats.avg * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">Avg Match</div>
                    </div>
                    <div>
                      <div className="font-semibold text-lg text-gray-900">
                        {categories.length}
                      </div>
                      <div className="text-sm text-gray-600">Categories</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Footer */}
          <footer className="text-center mt-12 text-white opacity-75">
            <p className="text-sm">
              Powered by TensorFlow.js and Next.js 15
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}