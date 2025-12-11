
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, Sun, CheckCircle2, Luggage, Umbrella, Trash2, Plus, Save } from 'lucide-react';
import { Trip, ClothingItem, TripPackingCategories } from '../types';
import { format, addDays } from 'date-fns';

interface TripDetailProps {
  trip: Trip;
  wardrobe: ClothingItem[];
  onBack: () => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const TripDetail: React.FC<TripDetailProps> = ({ trip, wardrobe, onBack, onUpdateTrip, onDeleteTrip }) => {
  const [activeTab, setActiveTab] = useState<'lookbook' | 'packing'>('lookbook');
  
  // Local state for editable packing list
  const [localPackingList, setLocalPackingList] = useState<TripPackingCategories>(
      trip.packingList || { clothes: [], toiletries: [], misc: [] }
  );
  
  const [newItemInputs, setNewItemInputs] = useState({ clothes: '', toiletries: '', misc: '' });
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state if trip prop changes (e.g. navigation)
  useEffect(() => {
    setLocalPackingList(trip.packingList || { clothes: [], toiletries: [], misc: [] });
    setHasChanges(false);
  }, [trip]);

  // Helper to find the actual clothing object by ID
  const getItem = (id?: string) => wardrobe.find(w => w.id === id);

  // Safety fallbacks
  const dailyPlan = trip.dailyPlan || [];

  const handleAddItem = (category: keyof TripPackingCategories) => {
      const val = newItemInputs[category].trim();
      if (!val) return;
      
      setLocalPackingList(prev => ({
          ...prev,
          [category]: [...prev[category], val]
      }));
      setNewItemInputs(prev => ({ ...prev, [category]: '' }));
      setHasChanges(true);
  };

  const handleRemoveItem = (category: keyof TripPackingCategories, index: number) => {
      setLocalPackingList(prev => ({
          ...prev,
          [category]: prev[category].filter((_, i) => i !== index)
      }));
      setHasChanges(true);
  };

  const handleSaveChanges = () => {
      onUpdateTrip({
          ...trip,
          packingList: localPackingList
      });
      setHasChanges(false);
  };

  const handleDeleteTripAction = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteTrip(trip.id);
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 relative">
      
      {/* Header Banner */}
      <div className="relative h-56 rounded-b-[40px] overflow-hidden bg-gray-900 mb-8 -mx-4 sm:mx-0 shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-slate-900" />
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
        
        {/* Buttons - Z-Index 50 to ensure clickability over blobs */}
        <div className="absolute top-6 left-4 right-4 z-50 flex justify-between items-start pointer-events-none">
            <button 
                onClick={onBack}
                className="pointer-events-auto p-2 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-colors border border-white/10"
            >
                <ArrowLeft size={20} />
            </button>
            
            <button
                onClick={handleDeleteTripAction}
                className="pointer-events-auto p-2 bg-red-500/80 backdrop-blur-md text-white rounded-full hover:bg-red-600 transition-colors border border-red-500/50 shadow-lg"
                title="Delete Trip"
            >
                <Trash2 size={20} />
            </button>
        </div>

        <div className="absolute bottom-8 left-6 right-6 text-white z-10">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-wider mb-2">
                <Luggage size={14} /> Trip Itinerary
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">{trip.destination}</h1>
            <div className="flex items-center gap-4 text-sm font-medium text-white/80">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Calendar size={14} />
                    {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d')}
                </div>
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                    <Sun size={14} />
                    {trip.weatherSummary}
                </div>
            </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center mb-8 px-4 sticky top-20 z-20">
        <div className="bg-white/90 backdrop-blur shadow-sm border border-gray-100 p-1 rounded-full flex gap-1">
            <button
                onClick={() => setActiveTab('lookbook')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeTab === 'lookbook' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
                Daily Lookbook
            </button>
            <button
                onClick={() => setActiveTab('packing')}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                    activeTab === 'packing' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
                }`}
            >
                Packing List
            </button>
        </div>
      </div>

      <div className="px-4 sm:px-0">
          {activeTab === 'lookbook' ? (
              <div className="space-y-8 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-px bg-gray-200 hidden sm:block" />

                  {dailyPlan.length === 0 && (
                      <div className="text-center py-10 text-gray-500 italic">
                          No daily plan generated. Check your trip settings.
                      </div>
                  )}

                  {dailyPlan.map((day, index) => {
                      const date = addDays(new Date(trip.startDate), index);
                      const top = getItem(day.outfit.topId);
                      const bottom = getItem(day.outfit.bottomId);
                      const shoe = getItem(day.outfit.shoeId);
                      const outer = getItem(day.outfit.outerwearId);

                      return (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={index}
                            className="relative pl-0 sm:pl-20"
                        >
                            {/* Timeline Dot */}
                            <div className="absolute left-6 top-8 w-4 h-4 bg-white border-4 border-blue-500 rounded-full z-10 hidden sm:block shadow-sm" />

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-50 pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Day {day.day}: {day.eventDescription}</h3>
                                        <p className="text-gray-500 text-sm mt-1">{format(date, 'EEEE, MMMM do')}</p>
                                    </div>
                                    <div className="mt-2 sm:mt-0 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-blue-100">
                                        <Umbrella size={12} /> {day.weatherForecast}
                                    </div>
                                </div>

                                {/* Visual Outfit Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {top && <OutfitItemCard item={top} label="Top" />}
                                    {bottom && <OutfitItemCard item={bottom} label="Bottom" />}
                                    {outer && <OutfitItemCard item={outer} label="Layer" />}
                                    {shoe && <OutfitItemCard item={shoe} label="Shoes" />}
                                    
                                    {/* Empty State Fallback if AI didn't pick items */}
                                    {!top && !bottom && !shoe && (
                                        <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                                            Stylist didn't select specific items from your closet for this day.
                                        </div>
                                    )}
                                </div>

                                {/* Stylist Notes */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-700 italic flex gap-3">
                                    <div className="w-1 bg-blue-400 rounded-full flex-shrink-0" />
                                    <p>"{day.outfit.notes}"</p>
                                </div>
                            </div>
                        </motion.div>
                      );
                  })}
              </div>
          ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20"
              >
                  {/* Clothes Section */}
                  <EditableListSection 
                    title="Clothing & Accessories"
                    items={localPackingList.clothes}
                    inputValue={newItemInputs.clothes}
                    onInputChange={(val) => setNewItemInputs(prev => ({ ...prev, clothes: val }))}
                    onAdd={() => handleAddItem('clothes')}
                    onRemove={(idx) => handleRemoveItem('clothes', idx)}
                  />

                  {/* Toiletries & Misc (Stacked column) */}
                  <div className="space-y-6">
                       <EditableListSection 
                        title="Toiletries"
                        items={localPackingList.toiletries}
                        inputValue={newItemInputs.toiletries}
                        onInputChange={(val) => setNewItemInputs(prev => ({ ...prev, toiletries: val }))}
                        onAdd={() => handleAddItem('toiletries')}
                        onRemove={(idx) => handleRemoveItem('toiletries', idx)}
                      />
                      
                       <EditableListSection 
                        title="Misc & Tech"
                        items={localPackingList.misc}
                        inputValue={newItemInputs.misc}
                        onInputChange={(val) => setNewItemInputs(prev => ({ ...prev, misc: val }))}
                        onAdd={() => handleAddItem('misc')}
                        onRemove={(idx) => handleRemoveItem('misc', idx)}
                      />
                  </div>
              </motion.div>
          )}
      </div>

      {/* Floating Save Button */}
      <AnimatePresence>
        {hasChanges && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-8 left-0 right-0 flex justify-center z-40 pointer-events-none"
            >
                <button 
                    onClick={handleSaveChanges}
                    className="pointer-events-auto bg-black text-white px-8 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <Save size={18} /> Save Changes
                </button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Sub-Components ---

const OutfitItemCard: React.FC<{ item: ClothingItem; label: string }> = ({ item, label }) => (
    <div className="group relative aspect-[3/4] rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
        <img src={item.image} alt={item.subCategory} className="w-full h-full object-contain p-2" />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-[10px] font-bold text-gray-500 uppercase tracking-wide shadow-sm">
            {label}
        </div>
    </div>
);

const EditableListSection: React.FC<{
    title: string;
    items: string[];
    inputValue: string;
    onInputChange: (val: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}> = ({ title, items, inputValue, onInputChange, onAdd, onRemove }) => {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-gray-900">{title}</h3>
            </div>
            <div className="p-2 space-y-1">
                {items.length === 0 && (
                    <p className="text-gray-400 text-sm p-3 text-center italic">No items listed</p>
                )}
                {items.map((item, i) => (
                    <div key={i} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center bg-white"></div>
                            <span className="text-sm font-medium text-gray-700">{item}</span>
                        </div>
                        <button 
                            onClick={() => onRemove(i)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
            {/* Add Item Input */}
            <div className="p-3 border-t border-gray-50">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Add item..."
                        value={inputValue}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onAdd()}
                        className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                        onClick={onAdd}
                        disabled={!inputValue.trim()}
                        className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
