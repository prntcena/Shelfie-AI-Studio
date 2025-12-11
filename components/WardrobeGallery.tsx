import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClothingItem, Category, Season } from '../types';
import { Filter, SearchX } from 'lucide-react';
import { FilterModal, FilterState } from './FilterModal';

interface WardrobeGalleryProps {
  items: ClothingItem[];
  onItemClick: (item: ClothingItem) => void;
}

export const WardrobeGallery: React.FC<WardrobeGalleryProps> = ({ items, onItemClick }) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'newest',
    categories: [],
    seasons: []
  });

  // Calculate if any filters are currently active (for the badge)
  const isFiltered = filters.categories.length > 0 || filters.seasons.length > 0;

  const filteredItems = useMemo(() => {
    let result = [...items];

    // 1. Filter by Category
    if (filters.categories.length > 0) {
      result = result.filter(item => filters.categories.includes(item.category as Category));
    }

    // 2. Filter by Season
    if (filters.seasons.length > 0) {
      result = result.filter(item => filters.seasons.includes(item.season as Season));
    }

    // 3. Sort
    result.sort((a, b) => {
      if (filters.sortBy === 'newest') return b.createdAt - a.createdAt;
      return a.createdAt - b.createdAt;
    });

    return result;
  }, [items, filters]);

  const handleClearFilters = () => {
    setFilters({ sortBy: 'newest', categories: [], seasons: [] });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      
      {/* Gallery Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Your Closet</h3>
          <p className="text-gray-500 text-sm mt-1">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            {isFiltered && ` (filtered from ${items.length})`}
          </p>
        </div>
        <button 
          onClick={() => setIsFilterOpen(true)}
          className={`
            relative p-3 rounded-full transition-all duration-200 border
            ${isFiltered 
              ? 'bg-black text-white border-black shadow-md' 
              : 'text-gray-400 hover:text-gray-900 bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200'}
          `}
        >
          <Filter size={20} />
          {isFiltered && (
             <span className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
          )}
        </button>
      </div>

      {/* Grid */}
      <motion.div 
        layout
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <AnimatePresence mode='popLayout'>
          {filteredItems.map((item) => (
            <motion.div
              layout
              layoutId={`item-${item.id}`}
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => onItemClick(item)}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 aspect-[4/5] relative border border-gray-100">
                <motion.img 
                  layoutId={`image-${item.id}`}
                  src={item.image} 
                  alt={item.subCategory}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Overlay Info on Hover */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white font-semibold text-sm truncate">{item.subCategory}</p>
                  <p className="text-white/80 text-xs">{item.category}</p>
                </div>

                {/* Category Badge (Mini) */}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-500 uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.season}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Empty State: No Uploads */}
        {items.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-400">Your closet is empty. Upload your first look above!</p>
          </div>
        )}

        {/* Empty State: No Filter Results */}
        {items.length > 0 && filteredItems.length === 0 && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }}
             className="col-span-full py-20 flex flex-col items-center justify-center text-center"
           >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <SearchX size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No items match</h3>
              <p className="text-gray-500 mb-6 max-w-xs">
                  We couldn't find any items with the selected filters.
              </p>
              <button 
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors"
              >
                  Clear Filters
              </button>
           </motion.div>
        )}
      </motion.div>

      <FilterModal 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApply={setFilters}
      />
    </div>
  );
};
