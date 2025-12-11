
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, Footprints, Layers, Sparkles, Plus, Save, X, Check, RotateCcw, Calendar } from 'lucide-react';
import { ClothingItem, Outfit, Category } from '../types';

interface OutfitCreatorProps {
  items: ClothingItem[];
  onSaveOutfit: (outfit: Outfit) => void;
  initialData?: Outfit | null;
  onCancelEdit?: () => void;
  planningDate?: string | null;
}

type SlotType = 'Top' | 'Bottom' | 'Shoe' | 'Accessory';

interface SlotConfig {
  id: SlotType;
  label: string;
  icon: React.ElementType;
  acceptedCategories: Category[];
}

const SLOTS: SlotConfig[] = [
  { id: 'Top', label: 'Tops & Outerwear', icon: Shirt, acceptedCategories: ['Top', 'Outerwear'] },
  { id: 'Bottom', label: 'Bottoms', icon: Layers, acceptedCategories: ['Bottom'] },
  { id: 'Shoe', label: 'Shoes', icon: Footprints, acceptedCategories: ['Shoe'] },
  { id: 'Accessory', label: 'Accessories', icon: Sparkles, acceptedCategories: ['Accessory', 'Other'] },
];

export const OutfitCreator: React.FC<OutfitCreatorProps> = ({ items, onSaveOutfit, initialData, onCancelEdit, planningDate }) => {
  const [activeSlot, setActiveSlot] = useState<SlotType>('Top');
  const [selections, setSelections] = useState<Record<SlotType, ClothingItem | null>>({
    Top: null,
    Bottom: null,
    Shoe: null,
    Accessory: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [outfitName, setOutfitName] = useState('');

  // Pre-fill data if editing
  useEffect(() => {
    if (initialData) {
      setOutfitName(initialData.name);
      
      const newSelections = {
        Top: null,
        Bottom: null,
        Shoe: null,
        Accessory: null,
      } as Record<SlotType, ClothingItem | null>;

      // Map items back to slots
      initialData.items.forEach(item => {
        const slot = SLOTS.find(s => s.acceptedCategories.includes(item.category as Category));
        if (slot) {
          if (!newSelections[slot.id]) {
            newSelections[slot.id] = item;
          }
        }
      });
      setSelections(newSelections);
    } else {
        setSelections({ Top: null, Bottom: null, Shoe: null, Accessory: null });
        setOutfitName('');
    }
  }, [initialData]);

  const filteredItems = useMemo(() => {
    const config = SLOTS.find(s => s.id === activeSlot);
    if (!config) return [];
    return items.filter(item => config.acceptedCategories.includes(item.category as Category));
  }, [items, activeSlot]);

  const handleSelectItem = (item: ClothingItem) => {
    setSelections(prev => ({ ...prev, [activeSlot]: item }));
  };

  const handleClearSlot = (e: React.MouseEvent, slot: SlotType) => {
    e.stopPropagation();
    setSelections(prev => ({ ...prev, [slot]: null }));
  };

  const handleSave = () => {
    const selectedItems = Object.values(selections).filter(Boolean) as ClothingItem[];
    if (selectedItems.length === 0) return; 
    setIsSaving(true);
  };

  const confirmSave = () => {
    if (!outfitName.trim()) return;
    
    const newOutfit: Outfit = {
      id: initialData ? initialData.id : crypto.randomUUID(), 
      name: outfitName,
      items: Object.values(selections).filter(Boolean) as ClothingItem[],
      createdAt: initialData ? initialData.createdAt : Date.now(),
    };

    onSaveOutfit(newOutfit);
    
    if (!initialData) {
        setSelections({ Top: null, Bottom: null, Shoe: null, Accessory: null });
        setOutfitName('');
    }
    setIsSaving(false);
  };

  const handleClearAll = () => {
      if (onCancelEdit) {
          onCancelEdit(); 
      } else {
          setSelections({ Top: null, Bottom: null, Shoe: null, Accessory: null });
          setOutfitName('');
      }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-6 max-w-7xl mx-auto px-4 pb-6" id="studio-canvas">
      
      {/* Zone A: The Mannequin (Canvas) */}
      <div className="w-full lg:w-1/2 flex flex-col gap-4 overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center px-2">
            <div>
                {planningDate ? (
                   <div className="flex items-center gap-2 text-blue-600 mb-1">
                       <Calendar size={16} />
                       <span className="text-xs font-bold uppercase tracking-wide">Mission Mode</span>
                   </div> 
                ) : null}
                <h3 className="text-xl font-bold text-gray-900">
                    {planningDate ? 'Design Your Look' : (initialData ? 'Editing Canvas' : 'Studio Canvas')}
                </h3>
            </div>
            
            <div className="flex gap-2">
                 <button 
                    onClick={handleClearAll}
                    className="px-4 py-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100 text-sm font-medium"
                >
                    {planningDate ? 'Cancel Plan' : (initialData ? 'Cancel Edit' : 'Clear')}
                </button>
                <button 
                    onClick={handleSave}
                    disabled={Object.values(selections).every(v => v === null)}
                    className="px-4 py-2 rounded-full bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {planningDate ? 'Save & Schedule' : (initialData ? 'Update Look' : 'Save Look')}
                </button>
            </div>
        </div>
        
        <div className="flex-1 flex flex-col gap-3 min-h-[400px]">
          {SLOTS.map((slot) => (
            <motion.div
              key={slot.id}
              layout
              onClick={() => setActiveSlot(slot.id)}
              className={`
                relative flex-1 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden group
                min-h-[120px] flex items-center justify-center
                ${activeSlot === slot.id 
                  ? 'border-blue-500 bg-blue-50/10 shadow-sm' 
                  : 'border-dashed border-gray-200 hover:border-gray-300 bg-gray-50/30'}
              `}
              whileTap={{ scale: 0.99 }}
            >
              {selections[slot.id] ? (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="w-full h-full relative"
                >
                    <img 
                        src={selections[slot.id]!.image} 
                        alt={slot.label} 
                        className="w-full h-full object-contain p-4"
                    />
                    <button 
                        onClick={(e) => handleClearSlot(e, slot.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <X size={14} />
                    </button>
                    <div className="absolute bottom-2 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md shadow-sm">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{selections[slot.id]!.subCategory}</span>
                    </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-300">
                    <slot.icon size={32} strokeWidth={1.5} />
                    <span className="text-xs font-medium uppercase tracking-widest">{slot.label}</span>
                </div>
              )}
              
              {activeSlot === slot.id && (
                <motion.div 
                    layoutId="active-ring"
                    className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Zone B: The Closet Drawer */}
      <div className="w-full lg:w-1/2 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
          <h4 className="font-semibold text-gray-900">
            {SLOTS.find(s => s.id === activeSlot)?.label}
          </h4>
          <p className="text-xs text-gray-500 mt-1">Select an item to add to your canvas</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
           {filteredItems.length > 0 ? (
               <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                 <AnimatePresence mode='popLayout'>
                   {filteredItems.map((item) => {
                     const isSelected = selections[activeSlot]?.id === item.id;
                     return (
                       <motion.div
                         layout
                         key={item.id}
                         initial={{ opacity: 0, scale: 0.8 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         onClick={() => handleSelectItem(item)}
                         className={`
                           relative aspect-square rounded-xl cursor-pointer overflow-hidden border transition-all duration-200
                           ${isSelected ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-100 hover:border-gray-300'}
                         `}
                       >
                         <img src={item.image} alt={item.subCategory} className="w-full h-full object-cover" />
                         {isSelected && (
                           <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                             <div className="bg-blue-500 text-white rounded-full p-1 shadow-sm">
                               <Check size={12} strokeWidth={3} />
                             </div>
                           </div>
                         )}
                       </motion.div>
                     );
                   })}
                 </AnimatePresence>
               </div>
           ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                   <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                        <Plus size={24} className="opacity-50" />
                   </div>
                   <p className="text-sm">No items found for this slot.</p>
               </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {isSaving && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {initialData ? 'Update Look' : 'Name your Look'}
                </h3>
                <input 
                    autoFocus
                    type="text" 
                    placeholder="e.g. Summer Date Night"
                    value={outfitName}
                    onChange={(e) => setOutfitName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-6"
                />
                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsSaving(false)}
                        className="flex-1 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmSave}
                        disabled={!outfitName.trim()}
                        className="flex-1 py-2.5 rounded-xl font-medium text-white bg-black hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {planningDate ? 'Save & Schedule' : (initialData ? 'Update' : 'Save')}
                    </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};