
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ScanFace, X, AlertTriangle, Wand2, CheckCircle2, RotateCcw, Rotate3D, Loader2 } from 'lucide-react';
import { ClothingItem, UserProfile, TryOnResult } from '../types';
import { generateBiometricTryOn, critiqueGeneratedLook, generateAngle } from '../services/gemini';

interface FittingRoomProps {
  userProfile: UserProfile;
  wardrobe: ClothingItem[];
  initialItem?: ClothingItem | null;
  onClose?: () => void;
}

const STEPS = [
    "Scanning biometrics...",
    "Measuring body proportions...",
    "Draping fabric...",
    "Simulating lighting...",
    "Stylist reviewing look..."
];

type LookComposition = {
    Top: ClothingItem | null;
    Bottom: ClothingItem | null;
    Shoe: ClothingItem | null;
};

type ViewAngle = 'front' | 'side' | 'back';

export const FittingRoom: React.FC<FittingRoomProps> = ({ userProfile, wardrobe, initialItem, onClose }) => {
  const [composition, setComposition] = useState<LookComposition>({
      Top: null,
      Bottom: null,
      Shoe: null
  });
  
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [activeView, setActiveView] = useState<ViewAngle>('front');
  const [generatingAngle, setGeneratingAngle] = useState<ViewAngle | null>(null);

  // Filtered wardrobes for the "Slot Machine"
  const tops = wardrobe.filter(i => i.category === 'Top' || i.category === 'Outerwear');
  const bottoms = wardrobe.filter(i => i.category === 'Bottom');
  const shoes = wardrobe.filter(i => i.category === 'Shoe');

  // Auto-Select Logic on Mount
  useEffect(() => {
    const newComp = { ...composition };
    if (!initialItem) {
        if (tops.length > 0) newComp.Top = tops[0];
        if (bottoms.length > 0) newComp.Bottom = bottoms[0];
        if (shoes.length > 0) newComp.Shoe = shoes[0];
    } else {
        if (['Top', 'Outerwear'].includes(initialItem.category)) newComp.Top = initialItem;
        if (initialItem.category === 'Bottom') newComp.Bottom = initialItem;
        if (initialItem.category === 'Shoe') newComp.Shoe = initialItem;
    }
    setComposition(newComp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSelect = (slot: keyof LookComposition, item: ClothingItem) => {
    setComposition(prev => ({
        ...prev,
        [slot]: prev[slot]?.id === item.id ? null : item
    }));
  };

  const handleGenerate = async () => {
    const selectedItems = Object.values(composition).filter(Boolean) as ClothingItem[];
    if (selectedItems.length === 0) return;

    setStatus('processing');
    setLoadingStep(0);
    setActiveView('front'); // Reset view on new generation
    
    const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % STEPS.length);
    }, 2000);

    try {
        const frontImage = await generateBiometricTryOn(userProfile, selectedItems);
        const critique = await critiqueGeneratedLook(userProfile, frontImage);

        setResult({
            id: crypto.randomUUID(),
            frontUrl: frontImage,
            criticVerdict: critique
        });
        setStatus('success');
    } catch (error) {
        console.error(error);
        setStatus('error');
    } finally {
        clearInterval(interval);
    }
  };

  const handleChangeView = async (angle: ViewAngle) => {
      if (!result) return;
      if (angle === 'front') {
          setActiveView('front');
          return;
      }

      // Check if already generated
      if (angle === 'side' && result.sideUrl) {
          setActiveView('side');
          return;
      }
      if (angle === 'back' && result.backUrl) {
          setActiveView('back');
          return;
      }

      // Generate on demand
      setGeneratingAngle(angle);
      const selectedItems = Object.values(composition).filter(Boolean) as ClothingItem[];
      
      try {
          const newImage = await generateAngle(userProfile, selectedItems, angle, result.frontUrl);
          
          setResult(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  [angle === 'side' ? 'sideUrl' : 'backUrl']: newImage
              };
          });
          setActiveView(angle);
      } catch (e) {
          console.error(`Failed to generate ${angle} view`, e);
      } finally {
          setGeneratingAngle(null);
      }
  };

  const isGenerateDisabled = Object.values(composition).every(item => item === null) || status === 'processing';

  const currentImage = (() => {
      if (!result) return null;
      if (activeView === 'front') return result.frontUrl;
      if (activeView === 'side') return result.sideUrl;
      if (activeView === 'back') return result.backUrl;
      return null;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col md:flex-row w-full h-full overflow-y-auto md:overflow-hidden">
        
        {/* --- LEFT COLUMN: THE MIRROR & VERDICT --- */}
        <div className="w-full md:w-3/5 h-auto md:h-full bg-gray-50 flex flex-col overflow-y-visible md:overflow-y-auto relative border-b md:border-b-0 md:border-r border-gray-200">
            
            <div className="absolute top-4 left-4 z-30 md:hidden">
                 {onClose && (
                    <button onClick={onClose} className="p-2 bg-white/80 backdrop-blur rounded-full shadow-sm text-gray-600">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:px-8 gap-6 w-full max-w-2xl mx-auto min-h-min">
                
                {/* 1. Image Area */}
                <div className={`
                    relative w-full transition-all duration-300
                    ${status === 'success' ? 'aspect-[3/4]' : 'aspect-[3/4]'}
                    bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center
                `}>
                    
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-gray-50 opacity-50" />

                    {status === 'idle' ? (
                        <div className="text-center opacity-60 z-10 px-6">
                            <ScanFace size={64} strokeWidth={1} className="mx-auto mb-4 text-gray-300" />
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Ready to Try On</h3>
                            <p className="text-gray-500 mt-2">Select at least one item.</p>
                        </div>
                    ) : status === 'processing' ? (
                        <div className="text-center space-y-6 z-10 px-6">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-3 border-t-4 border-purple-500 rounded-full animate-spin-slow"></div>
                            </div>
                            <AnimatePresence mode='wait'>
                                <motion.p 
                                    key={loadingStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-lg font-medium text-gray-600"
                                >
                                    {STEPS[loadingStep]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    ) : status === 'error' ? (
                        <div className="text-center z-10 px-6">
                            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                            <p className="font-semibold text-gray-900">Try-On Failed</p>
                            <button onClick={() => setStatus('idle')} className="mt-4 text-blue-500 underline">Try Again</button>
                        </div>
                    ) : (
                        // SUCCESS STATE
                        <>
                             <AnimatePresence mode="wait">
                                <motion.img 
                                    key={activeView}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    src={currentImage || ''} 
                                    alt="Try On Result" 
                                    className="relative z-10 w-full h-full object-contain bg-gray-50" 
                                />
                             </AnimatePresence>
                             
                             {/* Overlay Loader for Angle Generation */}
                             {generatingAngle && (
                                 <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                     <div className="text-center">
                                         <Loader2 className="animate-spin text-blue-500 mb-2 mx-auto" size={32} />
                                         <p className="text-sm font-semibold text-gray-700">Turning the model...</p>
                                     </div>
                                 </div>
                             )}
                        </>
                    )}
                </div>
                
                {/* Angle Selector (Only visible on success) */}
                {status === 'success' && result && (
                    <div className="flex bg-white rounded-full shadow-sm border border-gray-100 p-1 gap-1">
                        {(['front', 'side', 'back'] as ViewAngle[]).map((angle) => {
                            const hasImage = angle === 'front' || (angle === 'side' && result.sideUrl) || (angle === 'back' && result.backUrl);
                            return (
                                <button
                                    key={angle}
                                    onClick={() => handleChangeView(angle)}
                                    className={`
                                        relative px-6 py-2 rounded-full text-sm font-medium transition-all
                                        ${activeView === angle ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}
                                    `}
                                >
                                    {angle.charAt(0).toUpperCase() + angle.slice(1)}
                                    {!hasImage && activeView !== angle && (
                                        <div className="absolute top-1 right-1">
                                            <Rotate3D size={10} className="text-blue-500" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* 2. Verdict Block */}
                {status === 'success' && result && (
                    <FeedbackBlock verdict={result.criticVerdict} />
                )}

                {/* Desktop Generate Button */}
                 <div className="hidden md:block w-full pt-2">
                     <button 
                        onClick={handleGenerate}
                        disabled={isGenerateDisabled}
                        className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-bold shadow-xl hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                    >
                        {status === 'processing' ? 'Styling...' : (
                            <>
                                <Wand2 size={18} /> Generate Look
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: THE LABORATORY --- */}
        <div className="w-full md:w-2/5 h-auto md:h-full bg-white flex flex-col relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-none border-l border-gray-100">
            
            {/* Header (Desktop) */}
            <div className="p-6 border-b border-gray-100 hidden md:flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">The Laboratory</h2>
                    <p className="text-sm text-gray-500">Mix and match your inventory.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Carousels Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar py-8 space-y-8 bg-white">
                <ClothingCarousel 
                    label="Tops & Outerwear" 
                    items={tops} 
                    selectedId={composition.Top?.id} 
                    onSelect={(item) => handleSelect('Top', item)} 
                />

                <ClothingCarousel 
                    label="Bottoms" 
                    items={bottoms} 
                    selectedId={composition.Bottom?.id} 
                    onSelect={(item) => handleSelect('Bottom', item)} 
                />

                <ClothingCarousel 
                    label="Shoes" 
                    items={shoes} 
                    selectedId={composition.Shoe?.id} 
                    onSelect={(item) => handleSelect('Shoe', item)} 
                />
                
                {/* Spacer for mobile bottom button */}
                <div className="h-24 md:hidden" />
            </div>

            {/* Mobile Generate Button (Sticky Bottom) */}
            <div className="p-4 border-t border-gray-100 md:hidden sticky bottom-0 bg-white/90 backdrop-blur-md z-30">
                 <button 
                    onClick={handleGenerate}
                    disabled={isGenerateDisabled}
                    className="w-full flex items-center justify-center gap-2 bg-black text-white py-4 rounded-2xl font-bold shadow-xl pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {status === 'processing' ? 'Styling...' : (
                        <>
                            <Wand2 size={18} /> Generate Look
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};

// --- SUB-COMPONENT: FEEDBACK BLOCK ---
const FeedbackBlock: React.FC<{ verdict: TryOnResult['criticVerdict'] }> = ({ verdict }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
            <div className="flex gap-4 items-start">
                <div className="p-2 bg-blue-50 rounded-full text-blue-500 flex-shrink-0 mt-1">
                    <Sparkles size={20} />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-1">Stylist Verdict</h4>
                    <p className="text-gray-700 text-base leading-relaxed mb-4">
                        "{verdict.styleAdvice}"
                    </p>
                    
                    {/* Metrics */}
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-gray-600">
                                <span className="text-gray-900 font-bold">{verdict.identityMatchScore}%</span> Match
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                             <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="text-xs font-medium text-gray-600">
                                <span className="text-gray-900 font-bold">{verdict.realismScore}%</span> Realism
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// --- SUB-COMPONENT: CLOTHING CAROUSEL ---

interface ClothingCarouselProps {
    label: string;
    items: ClothingItem[];
    selectedId?: string;
    onSelect: (item: ClothingItem) => void;
}

const ClothingCarousel: React.FC<ClothingCarouselProps> = ({ label, items, selectedId, onSelect }) => {
    return (
        <div className="flex flex-col gap-3">
            <h4 className="px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</h4>
            
            {items.length === 0 ? (
                <div className="mx-6 h-24 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center text-gray-400 text-sm">
                    No items found
                </div>
            ) : (
                <div className="flex overflow-x-auto snap-x snap-mandatory px-6 gap-4 pb-4 no-scrollbar items-center">
                    {items.map((item) => {
                        const isSelected = selectedId === item.id;
                        return (
                            <motion.div
                                key={item.id}
                                layout
                                onClick={() => onSelect(item)}
                                initial={false}
                                animate={{ 
                                    scale: isSelected ? 1.05 : 1,
                                    opacity: isSelected ? 1 : 0.8,
                                    borderColor: isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(243, 244, 246, 1)'
                                }}
                                className={`
                                    flex-shrink-0 snap-center cursor-pointer relative
                                    w-24 h-24 rounded-2xl bg-white shadow-sm overflow-hidden
                                    border-2 transition-all duration-200
                                    ${isSelected ? 'ring-2 ring-blue-100 z-10 shadow-md' : 'border-gray-100'}
                                `}
                            >
                                <img src={item.image} alt="Clothing" className="w-full h-full object-contain p-2" />
                                {isSelected && (
                                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                                        <CheckCircle2 size={12} className="text-white" />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                    {/* Spacer for end padding */}
                    <div className="w-2 flex-shrink-0" />
                </div>
            )}
        </div>
    );
};
