
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Plus, X, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { 
  format, startOfISOWeek, endOfISOWeek, eachDayOfInterval, 
  addWeeks, isSameDay, addMonths, 
  startOfMonth, endOfMonth, isToday 
} from 'date-fns';
import { Outfit, ScheduleEntry, Trip } from '../types';

interface OutfitCalendarProps {
  outfits: Outfit[];
  schedule: ScheduleEntry[];
  trips: Trip[];
  onUpdateSchedule: (entry: ScheduleEntry) => void;
  onRemoveSchedule: (date: string) => void;
  onEditOutfit: (outfit: Outfit) => void;
  onStartPlanning: (date: string) => void;
  onEditTrip: (trip: Trip) => void;
}

export const OutfitCalendar: React.FC<OutfitCalendarProps> = ({ 
  outfits, schedule, trips, onUpdateSchedule, onRemoveSchedule, onEditOutfit, onStartPlanning, onEditTrip
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);

  const days = useMemo(() => {
    let start, end;
    if (viewMode === 'week') {
      start = startOfISOWeek(currentDate);
      end = endOfISOWeek(currentDate);
    } else {
      const monthStart = startOfMonth(currentDate);
      start = startOfISOWeek(monthStart);
      end = endOfISOWeek(endOfMonth(currentDate));
    }
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  const handlePrev = () => {
    setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, -1) : addMonths(prev, -1));
  };

  const handleNext = () => {
    setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1));
  };

  const getOutfitForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const entry = schedule.find(s => s.date === dateStr);
    if (!entry) return null;
    return outfits.find(o => o.id === entry.outfitId);
  };

  const isWithinInterval = (date: Date, start: string, end: string) => {
      const d = date.getTime();
      return d >= new Date(start).getTime() && d <= new Date(end).getTime();
  };

  const handleDayClick = (date: Date) => {
    setSelectedDateForModal(date);
  };

  const handleSelectOutfit = (outfit: Outfit) => {
    if (selectedDateForModal) {
      onUpdateSchedule({
        date: format(selectedDateForModal, 'yyyy-MM-dd'),
        outfitId: outfit.id
      });
      setSelectedDateForModal(null);
    }
  };

  const handleRemoveOutfit = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    onRemoveSchedule(dateStr);
    setSelectedDateForModal(null); 
  };

  const handleTriggerEdit = (e: React.MouseEvent, outfit: Outfit) => {
      e.stopPropagation();
      onEditOutfit(outfit);
      setSelectedDateForModal(null);
  }

  const handleCreateNew = (date: Date) => {
      onStartPlanning(format(date, 'yyyy-MM-dd'));
      setSelectedDateForModal(null);
  };

  const activePlan = selectedDateForModal ? getOutfitForDate(selectedDateForModal) : null;

  const slideVariants = {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20" id="calendar-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
          <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-semibold w-32 text-center text-gray-900">
            {viewMode === 'week' 
              ? `${format(days[0], 'MMM d')} - ${format(days[days.length-1], 'MMM d')}` 
              : format(currentDate, 'MMMM yyyy')
            }
          </span>
          <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-full">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'week' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            <List size={14} /> Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${
              viewMode === 'month' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
            }`}
          >
            <CalendarIcon size={14} /> Month
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${format(currentDate, 'yyyy-MM-dd')}`}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          {viewMode === 'month' ? (
            // MONTH VIEW
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-400">
                  {day}
                </div>
              ))}
              {days.map((day) => {
                const outfit = getOutfitForDate(day);
                const isCurrentMonth = format(day, 'M') === format(currentDate, 'M');
                const isTodayDate = isToday(day);
                
                // Trip Logic
                const activeTrip = trips.find(t => isWithinInterval(day, t.startDate, t.endDate));
                const isTripStart = activeTrip && isSameDay(day, new Date(activeTrip.startDate));
                const isFirstVisibleDay = activeTrip && isSameDay(day, days[0]); 
                const showTripLabel = isTripStart || isFirstVisibleDay;

                return (
                  <div 
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`
                      min-h-[80px] sm:min-h-[120px] bg-white p-2 cursor-pointer transition-colors relative group
                      ${!isCurrentMonth ? 'bg-gray-50/50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className={`
                      text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1
                      ${isTodayDate ? 'bg-blue-500 text-white font-bold' : 'text-gray-500'}
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    {outfit && !activeTrip && (
                      <div className="mt-1">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-100 shadow-sm relative">
                           <img src={outfit.items[0]?.image} alt="outfit" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {activeTrip && (
                        <div 
                            onClick={(e) => { e.stopPropagation(); onEditTrip(activeTrip); }}
                            className={`
                                absolute bottom-1 left-0 right-0 mx-1 p-1 rounded-md text-[10px] font-semibold truncate
                                bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors z-10
                            `}
                        >
                            {showTripLabel ? activeTrip.destination : '•'}
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // WEEK VIEW
            <div className="flex flex-col md:grid md:grid-cols-7 gap-4">
              {days.map((day) => {
                const outfit = getOutfitForDate(day);
                const isTodayDate = isToday(day);
                const activeTrip = trips.find(t => isWithinInterval(day, t.startDate, t.endDate));
                
                return (
                  <motion.div
                    layout
                    key={day.toISOString()}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative flex md:flex-col gap-4 md:gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer group min-h-[100px] md:min-h-[300px]
                      ${isTodayDate ? 'border-blue-500/30 bg-blue-50/10' : 'border-dashed border-gray-200 bg-white hover:border-gray-300'}
                      ${activeTrip ? 'bg-blue-50/30' : ''}
                    `}
                  >
                     {/* Date Label */}
                    <div className="flex flex-col md:items-center min-w-[60px] md:min-w-0 md:mb-2">
                        <span className={`text-xs uppercase font-bold tracking-wider ${isTodayDate ? 'text-blue-600' : 'text-gray-400'}`}>
                            {format(day, 'EEE')}
                        </span>
                        <span className={`text-xl md:text-2xl font-semibold ${isTodayDate ? 'text-blue-600' : 'text-gray-900'}`}>
                            {format(day, 'd')}
                        </span>
                        {activeTrip && (
                            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full mt-1">Trip</span>
                        )}
                    </div>

                    <div className="flex-1 w-full relative">
                        {outfit ? (
                             <div className="w-full h-full flex items-center md:flex-col md:items-stretch gap-4">
                                <div className="relative aspect-square md:aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-gray-100 flex-shrink-0 w-16 md:w-full">
                                    <div className="grid grid-cols-2 h-full">
                                        {outfit.items.slice(0,4).map((item, i) => (
                                            <img key={i} src={item.image} className="w-full h-full object-cover" alt="" />
                                        ))}
                                    </div>
                                    <div className="absolute top-1 right-1 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleTriggerEdit(e, outfit)}
                                            className="p-1 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-600 hover:text-blue-600 transition-colors"
                                            title="Edit Outfit"
                                        >
                                            <Pencil size={12} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleRemoveOutfit(e, format(day, 'yyyy-MM-dd'))}
                                            className="p-1 bg-white/90 backdrop-blur rounded-full shadow-sm text-gray-600 hover:text-red-500 transition-colors"
                                            title="Remove from Schedule"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{outfit.name}</p>
                                    <p className="text-xs text-gray-500">{outfit.items.length} items</p>
                                </div>
                             </div>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center md:py-8">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors mb-2">
                                    <Plus size={20} className="text-gray-400 group-hover:text-blue-500" />
                                </div>
                                <span className="text-xs text-gray-400 font-medium md:hidden">Tap to plan</span>
                            </div>
                        )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedDateForModal && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDateForModal(null)}
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white w-full max-w-md max-h-[80vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900">
                                {format(selectedDateForModal, 'EEEE, MMM d')}
                            </h3>
                            {activePlan && (
                                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                    <CheckCircle2 size={12} /> Scheduled
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto p-4 flex-1">
                        {activePlan ? (
                            <div className="space-y-6">
                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative group">
                                    <div className="aspect-[4/3] grid grid-cols-2 bg-gray-50">
                                         {activePlan.items.slice(0,4).map((item, i) => (
                                            <img key={i} src={item.image} className="w-full h-full object-cover" alt="" />
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
                                        <h2 className="text-white text-2xl font-bold">{activePlan.name}</h2>
                                        <p className="text-white/80 text-sm">{activePlan.items.length} items</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={(e) => handleTriggerEdit(e, activePlan)}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-lg"
                                    >
                                        <Pencil size={18} /> Edit Look
                                    </button>
                                    <button 
                                        onClick={(e) => handleRemoveOutfit(e, format(selectedDateForModal, 'yyyy-MM-dd'))}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors"
                                    >
                                        <Trash2 size={18} /> Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => handleCreateNew(selectedDateForModal)}
                                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors mb-6 group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                                        <Plus size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900 group-hover:text-blue-700">Create New Look</p>
                                        <p className="text-xs text-gray-500">Open the studio for this date</p>
                                    </div>
                                </button>

                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Saved Outfits</h4>
                                {outfits.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-400 text-sm">No saved outfits yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {outfits.map(outfit => (
                                            <div
                                                key={outfit.id}
                                                className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 border border-gray-100 hover:border-blue-200 transition-all group relative cursor-pointer"
                                                onClick={() => handleSelectOutfit(outfit)}
                                            >
                                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 grid grid-cols-2 gap-px flex-shrink-0">
                                                    {outfit.items.slice(0,4).map((item, i) => (
                                                        <img key={i} src={item.image} className="w-full h-full object-cover" alt="" />
                                                    ))}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {outfit.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{outfit.items.length} items</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                        <button 
                            onClick={() => setSelectedDateForModal(null)}
                            className="px-6 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
