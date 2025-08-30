import { Filter, RotateCcw, X } from 'lucide-react';

interface SearchFiltersProps {
  categories: string[];
  filters: {
    category: string;
    minSimilarity: number;
  };
  onFiltersChange: (filters: { category: string; minSimilarity: number }) => void;
  onReset?: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  categories,
  filters,
  onFiltersChange,
  onReset
}) => {
  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category
    });
  };

  const handleSimilarityChange = (minSimilarity: number) => {
    onFiltersChange({
      ...filters,
      minSimilarity
    });
  };

  const handleReset = () => {
    onFiltersChange({
      category: '',
      minSimilarity: 0
    });
    onReset?.();
  };

  const hasActiveFilters = filters.category || filters.minSimilarity > 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-gray-700">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters:</span>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Category:</label>
          <select
            value={filters.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Similarity Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">Min Similarity:</label>
          <select
            value={filters.minSimilarity}
            onChange={(e) => handleSimilarityChange(parseFloat(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value={0}>All Results</option>
            <option value={0.3}>30%+</option>
            <option value={0.5}>50%+</option>
            <option value={0.7}>70%+</option>
            <option value={0.9}>90%+</option>
          </select>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            title="Reset filters"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 ml-auto">
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {filters.category}
                <button
                  onClick={() => handleCategoryChange('')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.minSimilarity > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {(filters.minSimilarity * 100).toFixed(0)}%+ similarity
                <button
                  onClick={() => handleSimilarityChange(0)}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for individual filter tags
const FilterTag: React.FC<{
  label: string;
  onRemove: () => void;
  color?: 'blue' | 'green' | 'purple';
}> = ({ label, onRemove, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    green: 'bg-green-100 text-green-800 hover:bg-green-200',
    purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${colorClasses[color]}`}>
      {label}
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
};