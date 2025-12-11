
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Sparkles, Shirt, Repeat, X, ArrowRight, Loader2, Plane } from 'lucide-react';
import { ClothingItem, Trip, UserProfile } from '../types';
import { generateTripPlan } from '../services/gemini';

interface TripPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: ClothingItem[];
  userProfile?: UserProfile | null;
  onTripCreated: (trip: Trip) => void;
}

const LOADING_MESSAGES = [
    "Checking forecast...",
    "Scanning your closet...",
    "Matching colors to events...",
    "Styling outfits...",
    "Folding virtual clothes..."
];

export const TripPlannerModal: React.FC<TripPlannerModalProps> = ({ isOpen, onClose, wardrobe, userProfile, onTripCreated }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Form State
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventsDesc, setEventsDesc] = useState('');
  const [strictCloset, setStrictCloset] = useState(false);
  const [allowRepeats, setAllowRepeats] = useState(true);

  // Loading Message Cycler
  useEffect(() => {
    if (isLoading) {
        const interval = setInterval(() => {
            setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
        }, 1500);
        return () => clearInterval(interval);
    }
  }, [isLoading]);

  if (!isOpen) return null;

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleGenerate = async () => {
    setIsLoading(true);

    // Safety timeout to prevent infinite loops if API hangs
    // Flash should resolve quickly, so 30s is generous.
    const timeoutId = setTimeout(() => {
        setIsLoading(false);
        alert("The stylist is taking too long. Please try again.");
    }, 30000);

    try {
        const plan = await generateTripPlan(
            destination,
            startDate,
            endDate,
            eventsDesc,
            { strictCloset, allowRepeats },
            wardrobe,
            userProfile || undefined
        );

        clearTimeout(timeoutId);

        const newTrip: Trip = {
            id: crypto.randomUUID(),
            destination,
            startDate,
            endDate,
            eventsDescription: eventsDesc,
            preferences: { strictCloset, allowRepeats },
            weatherSummary: plan.weatherSummary || "Weather data unavailable",
            dailyPlan: plan.dailyPlan || [],
            packingList: plan.packingList || { clothes: [], toiletries: [], misc: [] },
            createdAt: Date.now()
        };

        onTripCreated(newTrip);
        onClose();
        // Reset form
        setStep(1);
        setDestination('');
        setStartDate('');
        setEndDate('');
        setEventsDesc('');
    } catch (e) {
        clearTimeout(timeoutId);
        console.error(e);
        alert("Failed to generate plan. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
                <Plane className="text-blue-500" size={20} />
                Trip Planner
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
            </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                        <Loader2 size={48} className="text-blue-500 animate-spin" />
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={loadingMsgIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-lg font-medium text-gray-700"
                        >
                            {LOADING_MESSAGES[loadingMsgIndex]}
                        </motion.p>
                    </AnimatePresence>
                    <p className="text-sm text-gray-400 mt-2">AI is curating your lookbook...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Step 1: Logistics */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Where are you headed?</h3>
                                <p className="text-sm text-gray-500 mb-6">We'll check the weather for you.</p>
                                
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <div className="relative bg-gray-100 rounded-2xl overflow-hidden group focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                <MapPin size={20} />
                                            </div>
                                            <label className="absolute top-2 left-12 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Destination</label>
                                            <input 
                                                type="text" 
                                                placeholder="City, Country" 
                                                className="w-full bg-transparent border-none pt-7 pb-3 pl-12 pr-4 text-gray-900 font-semibold text-lg outline-none placeholder:text-gray-400"
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* iOS Style Date Picker Group */}
                                    <div className="bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                                        <div className="relative border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <label className="absolute top-2.5 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-wide z-10">Starts</label>
                                            <input 
                                                type="date" 
                                                className="w-full bg-transparent border-none pt-7 pb-2 px-4 text-gray-900 font-semibold text-base outline-none appearance-none min-h-[60px] relative z-20 cursor-pointer"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                style={{ colorScheme: 'light' }}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <Calendar size={18} />
                                            </div>
                                        </div>
                                        <div className="relative hover:bg-gray-50 transition-colors">
                                            <label className="absolute top-2.5 left-4 text-[10px] font-bold text-gray-500 uppercase tracking-wide z-10">Ends</label>
                                            <input 
                                                type="date" 
                                                className="w-full bg-transparent border-none pt-7 pb-2 px-4 text-gray-900 font-semibold text-base outline-none appearance-none min-h-[60px] relative z-20 cursor-pointer"
                                                value={endDate}
                                                min={startDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                style={{ colorScheme: 'light' }}
                                            />
                                             <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <Calendar size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Vibe */}
                    {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">What's on the agenda?</h3>
                                <p className="text-sm text-gray-500 mb-4">Mention specific events like "Hiking" or "Sangeet".</p>
                                <textarea 
                                    className="w-full h-32 bg-gray-100 rounded-2xl p-4 text-base font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none resize-none transition-all"
                                    placeholder="e.g. Landing on Friday morning. Corporate dinner that night. Sightseeing on Saturday (lots of walking). Sunday brunch before flying out."
                                    value={eventsDesc}
                                    onChange={(e) => setEventsDesc(e.target.value)}
                                />
                                <div className="mt-3 flex gap-2">
                                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full border border-yellow-200">Haldi</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">Mehendi</span>
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200">Reception</span>
                                    <span className="text-xs text-gray-400 self-center ml-auto">Cultural keywords supported</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Strategy */}
                    {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Packing Strategy</h3>
                                <p className="text-sm text-gray-500 mb-6">Customize how AI builds your packing list.</p>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Shirt size={20} className="text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Shop from Closet Only</p>
                                                <p className="text-xs text-gray-500">Don't suggest items I need to buy.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setStrictCloset(!strictCloset)}
                                            className={`w-12 h-7 rounded-full transition-colors relative ${strictCloset ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${strictCloset ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Repeat size={20} className="text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">Maximize Rewearing</p>
                                                <p className="text-xs text-gray-500">Reuse basics to save luggage space.</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setAllowRepeats(!allowRepeats)}
                                            className={`w-12 h-7 rounded-full transition-colors relative ${allowRepeats ? 'bg-green-500' : 'bg-gray-300'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${allowRepeats ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        {!isLoading && (
            <div className="p-6 border-t border-gray-100 bg-white">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${step === i ? 'bg-blue-500' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        {step > 1 && (
                            <button 
                                onClick={handleBack}
                                className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Back
                            </button>
                        )}
                        {step < 3 ? (
                            <button 
                                onClick={handleNext}
                                disabled={step === 1 && (!destination || !startDate || !endDate)}
                                className="px-6 py-3 rounded-xl text-sm font-semibold bg-black text-white hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                Next <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleGenerate}
                                className="px-8 py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors flex items-center gap-2"
                            >
                                <Sparkles size={16} /> Generate Plan
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
      </motion.div>
    </div>
  );
};
