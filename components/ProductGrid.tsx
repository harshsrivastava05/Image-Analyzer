import { useState } from 'react';
import { Search, Star, ExternalLink } from 'lucide-react';
import { SearchResult } from '../lib/database';

interface ProductGridProps {
  products: SearchResult[];
  isLoading?: boolean;
  onProductClick?: (product: SearchResult) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onProductClick
}) => {
  if (isLoading) {
    return <LoadingGrid />;
  }

  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onClick={onProductClick}
        />
      ))}
    </div>
  );
};

interface ProductCardProps {
  product: SearchResult;
  onClick?: (product: SearchResult) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleClick = () => {
    onClick?.(product);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getSimilarityText = (score: number) => {
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Good match';
    if (score >= 40) return 'Fair match';
    return 'Weak match';
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
      onClick={handleClick}
    >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {!imageError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className={`w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex flex-col items-center justify-center text-gray-500">
            <Search className="w-8 h-8 mb-2" />
            <span className="text-sm">Image not available</span>
          </div>
        )}

        {/* Similarity Badge */}
        <div className="absolute top-3 right-3">
          <span 
            className={`${getSimilarityColor(product.matchScore)} text-white px-2 py-1 rounded-full text-sm font-medium shadow-lg`}
            title={getSimilarityText(product.matchScore)}
          >
            {product.matchScore}%
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {product.name}
          </h4>
          <p className="text-blue-600 text-sm font-medium">
            {product.category}
          </p>
        </div>

        {/* Price and Rating */}
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-lg text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.5</span>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {product.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200">
            View Details
          </button>
          <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors duration-200">
            Compare
          </button>
        </div>
      </div>
    </div>
  );
};

const LoadingGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="w-full h-48 bg-gray-200 animate-pulse"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-16">
      <div className="mb-6">
        <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No products found
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          We couldn't find any products matching your criteria. Try adjusting your filters or uploading a different image.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
        <h4 className="font-medium text-gray-900 mb-3">Suggestions:</h4>
        <ul className="text-sm text-gray-600 space-y-2 text-left">
          <li>• Try uploading a clearer, well-lit image</li>
          <li>• Remove or reduce similarity filters</li>
          <li>• Try a different product category</li>
          <li>• Upload an image of a common product type</li>
        </ul>
      </div>
    </div>
  );
};