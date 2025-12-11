
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Tag as TagIcon, Trash2, ScanFace } from 'lucide-react';
import { ClothingItem, Category, Season } from '../types';

interface ItemDetailModalProps {
  isOpen: boolean;
  item: ClothingItem | null;
  onClose: () => void;
  onSave: (item: ClothingItem) => void;
  onDelete: (id: string) => void;
  onTryOn: (item: ClothingItem) => void; 
}

const CATEGORIES: Category[] = ['Top', 'Bottom', 'Shoe', 'Outerwear', 'Accessory', 'Other'];
const SEASONS: Season[] = ['Summer', 'Spring', 'Fall', 'Winter', 'All'];

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ 
  isOpen, item, onClose, onSave, onDelete, onTryOn 
}) => {
  const [editedItem, setEditedItem] = useState<ClothingItem | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  if (!isOpen || !editedItem) return null;

  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      setEditedItem({
        ...editedItem,
        tags: [...editedItem.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedItem({
      ...editedItem,
      tags: editedItem.tags.filter(t => t !== tagToRemove)
    });
  };

  const handleTryOnClick = () => {
      onTryOn(editedItem);
      onClose(); // Explicitly close modal
  };

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
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4 sm:p-6">
            <motion.div
              layoutId={editedItem.id ? `item-${editedItem.id}` : 'new-upload'}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="bg-white w-full max-w-4xl h-[85vh] sm:h-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col sm:flex-row pointer-events-auto"
            >
              
              {/* Left: Image Display */}
              <div className="w-full sm:w-1/2 h-1/2 sm:h-full bg-gray-50 relative p-6 flex items-center justify-center group">
                <motion.img 
                  layoutId={`image-${editedItem.id}`}
                  src={editedItem.image} 
                  alt={editedItem.subCategory}
                  className="w-full h-full object-contain drop-shadow-lg rounded-xl"
                />
                
                {/* Try On Button Overlay */}
                <div className="absolute bottom-6 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                        onClick={handleTryOnClick}
                        className="bg-black/80 backdrop-blur text-white px-5 py-2.5 rounded-full font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                    >
                        <ScanFace size={18} />
                        Virtual Try-On
                    </button>
                </div>

                <button 
                    onClick={onClose}
                    className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur rounded-full sm:hidden shadow-sm"
                >
                    <X size={20} />
                </button>
              </div>

              {/* Right: Details Form */}
              <div className="w-full sm:w-1/2 h-1/2 sm:h-full overflow-y-auto bg-white p-8 no-scrollbar">
                
                {/* Header Actions */}
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Details</h2>
                  <div className="flex gap-2">
                     <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(editedItem.id)}
                      className="p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={20} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onClose}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors hidden sm:block"
                    >
                      <X size={24} />
                    </motion.button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  
                  {/* Category & SubCategory */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
                      <select 
                        value={editedItem.category}
                        onChange={(e) => setEditedItem({...editedItem, category: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</label>
                      <input 
                        type="text"
                        value={editedItem.subCategory}
                        onChange={(e) => setEditedItem({...editedItem, subCategory: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Color & Season */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Color</label>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                        <div className="w-4 h-4 rounded-full shadow-sm border border-gray-200" style={{ backgroundColor: editedItem.primaryColor.toLowerCase() }} />
                        <input 
                          type="text"
                          value={editedItem.primaryColor}
                          onChange={(e) => setEditedItem({...editedItem, primaryColor: e.target.value})}
                          className="w-full bg-transparent border-none p-0 text-sm font-medium focus:ring-0 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Season</label>
                      <select 
                        value={editedItem.season}
                        onChange={(e) => setEditedItem({...editedItem, season: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                      >
                        {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {editedItem.tags.map(tag => (
                        <motion.span 
                          key={tag}
                          layout
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} <X size={12} className="ml-1 opacity-50" />
                        </motion.span>
                      ))}
                      <div className="flex items-center bg-gray-50 rounded-full px-3 py-1 focus-within:ring-2 focus-within:ring-blue-500/50">
                        <TagIcon size={12} className="text-gray-400 mr-2" />
                        <input
                          type="text"
                          placeholder="Add tag..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={handleAddTag}
                          className="bg-transparent border-none p-0 text-xs w-20 focus:ring-0 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSave}
                    className="w-full bg-black text-white rounded-xl py-3.5 font-semibold shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    Save to Closet
                  </motion.button>
                </div>

              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
