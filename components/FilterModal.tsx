import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ArrowDownUp, Tag, CloudSun } from 'lucide-react';
import { Category, Season } from '../types';

export interface FilterState {
  sortBy: 'newest' | 'oldest';
  categories: Category[];
  seasons: Season[];
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterState;
  onApply: (filters: FilterState) => void;
}

const CATEGORIES: Category[] = ['Top', 'Bottom', 'Shoe', 'Outerwear', 'Accessory', 'Other'];
const SEASONS: Season[] = ['Summer', 'Spring', 'Fall', 'Winter', 'All'];

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, currentFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const toggleCategory = (cat: Category) => {
    setLocalFilters(prev => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists 
          ? prev.categories.filter(c => c !== cat)
          : [...prev.categories, cat]
      };
    });
  };

  const toggleSeason = (season: Season) => {
    setLocalFilters(prev => {
      const exists = prev.seasons.includes(season);
      return {
        ...prev,
        seasons: exists 
          ? prev.seasons.filter(s => s !== season)
          : [...prev.seasons, season]
      };
    });
  };

  const handleClear = () => {
    setLocalFilters({
      sortBy: 'newest',
      categories: [],
      seasons: []
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[85vh]"
            >
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10">
                <h3 className="text-lg font-bold text-gray-900">Filter & Sort</h3>
                <button 
                  onClick={onClose}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto space-y-8">
                
                {/* Sort Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold text-sm uppercase tracking-wide">
                    <ArrowDownUp size={16} className="text-blue-500" /> Sort By
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['newest', 'oldest'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setLocalFilters(prev => ({ ...prev, sortBy: option as any }))}
                        className={`
                          py-3 px-4 rounded-xl text-sm font-medium transition-all border
                          ${localFilters.sortBy === option 
                            ? 'bg-black text-white border-black shadow-md' 
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}
                        `}
                      >
                        {option === 'newest' ? 'Newest Added' : 'Oldest Added'}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Category Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold text-sm uppercase tracking-wide">
                    <Tag size={16} className="text-purple-500" /> Categories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => {
                      const isSelected = localFilters.categories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`
                            px-4 py-2 rounded-full text-xs font-medium transition-all border
                            ${isSelected 
                              ? 'bg-black text-white border-black shadow-sm' 
                              : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'}
                          `}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Season Section */}
                <section>
                  <div className="flex items-center gap-2 mb-3 text-gray-900 font-semibold text-sm uppercase tracking-wide">
                    <CloudSun size={16} className="text-orange-500" /> Season
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((season) => {
                      const isSelected = localFilters.seasons.includes(season);
                      return (
                        <button
                          key={season}
                          onClick={() => toggleSeason(season)}
                          className={`
                            px-4 py-2 rounded-full text-xs font-medium transition-all border
                            ${isSelected 
                              ? 'bg-black text-white border-black shadow-sm' 
                              : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'}
                          `}
                        >
                          {season}
                        </button>
                      );
                    })}
                  </div>
                </section>

              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4">
                <button 
                  onClick={handleClear}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Clear All
                </button>
                <button 
                  onClick={handleApply}
                  className="flex-[2] py-3.5 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Check size={18} /> Apply Filters
                </button>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
