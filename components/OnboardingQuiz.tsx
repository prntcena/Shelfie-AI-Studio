
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Ruler, Weight, ArrowRight, User } from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingQuizProps {
  onComplete: (profile: UserProfile) => void;
}

// --- CONFIGURATION ---

const STYLE_CHIPS = [
  'Minimalist', 'Streetwear', 'Classic', 'Bohemian', 
  'Grunge', 'Preppy', 'Athleisure', 'Vintage', 
  'Avant Garde', 'Business Casual', 'Techwear', 'Romantic'
];

type Gender = 'Female' | 'Male' | 'Non-Binary' | 'Prefer not to say';

// Configuration mapping shapes to IDs.
const SHAPE_OPTIONS: Record<string, { id: string; label: string }[]> = {
  Female: [
    { id: 'Hourglass', label: 'Hourglass' },
    { id: 'Pear', label: 'Pear (Triangle)' },
    { id: 'Inverted Triangle', label: 'Inv. Triangle' },
    { id: 'Rectangle', label: 'Rectangle' },
    { id: 'Apple', label: 'Apple (Oval)' },
  ],
  Male: [
    { id: 'Trapezoid', label: 'Trapezoid' },
    { id: 'Rectangle', label: 'Rectangle' },
    { id: 'Inverted Triangle', label: 'Inv. Triangle' },
    { id: 'Oval', label: 'Oval' },
    { id: 'Triangle', label: 'Triangle' },
  ]
};

// Fallback for Non-Binary/Other
SHAPE_OPTIONS['Non-Binary'] = SHAPE_OPTIONS.Male;
SHAPE_OPTIONS['Prefer not to say'] = SHAPE_OPTIONS.Male;

// --- SVG SHAPE COMPONENT ---

const ShapeIllustration: React.FC<{ shapeId: string; isSelected: boolean }> = ({ shapeId, isSelected }) => {
  
  // Standard styling
  const strokeColor = isSelected ? '#3B82F6' : '#D1D5DB'; // Blue-500 : Gray-300
  const fillColor = isSelected ? '#EFF6FF' : '#F3F4F6';   // Blue-50 : Gray-100
  const strokeWidth = isSelected ? 2.5 : 2;

  const renderBodyPath = () => {
    switch (shapeId) {
      case 'Hourglass':
        // Wide shoulders, narrow waist, wide hips
        return <path d="M 30 35 L 70 35 L 50 65 L 70 95 L 30 95 L 50 65 Z" />;
      
      case 'Pear':
      case 'Triangle':
        // Narrow shoulders, wide hips
        return <path d="M 40 35 L 60 35 L 75 95 L 25 95 Z" />;
      
      case 'Inverted Triangle':
        // Wide shoulders, narrow hips
        return <path d="M 25 35 L 75 35 L 60 95 L 40 95 Z" />;
      
      case 'Rectangle':
        // Equal width
        return <path d="M 35 35 L 65 35 L 65 95 L 35 95 Z" />;
      
      case 'Apple':
      case 'Oval':
        // Rounded midsection
        return <path d="M 40 35 L 60 35 C 85 55 85 75 60 95 L 40 95 C 15 75 15 55 40 35 Z" />;
      
      case 'Trapezoid':
        // Broad shoulders, slightly tapering (Athletic)
        return <path d="M 25 35 L 75 35 L 68 95 L 32 95 Z" />;
        
      default:
        // Fallback Rectangle
        return <path d="M 35 35 L 65 35 L 65 95 L 35 95 Z" />;
    }
  };

  return (
    <div className="w-full h-40 flex items-center justify-center p-2">
      <svg width="100%" height="100%" viewBox="0 0 100 120" className="overflow-visible transition-all duration-300">
        <g 
          fill={fillColor} 
          stroke={strokeColor} 
          strokeWidth={strokeWidth} 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-colors duration-300"
        >
          {/* Head (Universal) */}
          <circle cx="50" cy="18" r="10" />
          
          {/* Body (Variable) */}
          {renderBodyPath()}
        </g>
      </svg>
    </div>
  );
};


// --- MAIN COMPONENT ---

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    name: '',
    gender: 'Female',
    heightCm: 170,
    weightKg: 65,
    stylePreferences: [],
    allowPersonalization: true,
    skinTone: '#E8D2C2',
    onboardingCompleted: false
  });

  const handleNext = () => setStep(prev => prev + 1);
  
  const handleComplete = () => {
    setIsSubmitting(true);
    setTimeout(() => {
        onComplete({ ...formData, onboardingCompleted: true } as UserProfile);
    }, 2000);
  };

  const toggleStyle = (style: string) => {
    const current = formData.stylePreferences || [];
    if (current.includes(style)) {
      setFormData({ ...formData, stylePreferences: current.filter(s => s !== style) });
    } else {
      setFormData({ ...formData, stylePreferences: [...current, style] });
    }
  };

  useEffect(() => {
    if (step === 4) {
      handleComplete();
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-100 w-full">
        <motion.div 
          className="h-full bg-black"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full overflow-y-auto">
        <AnimatePresence mode="wait">
            
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Welcome to Shelfie.</h1>
                <p className="text-gray-500 text-lg">Let's verify your fit details.</p>
              </div>

              <div className="space-y-6 bg-gray-50 p-6 sm:p-8 rounded-[2rem]">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="First Name"
                    className="w-full bg-white mt-2 p-4 rounded-xl border-2 border-transparent focus:border-black shadow-sm outline-none text-lg font-medium transition-all"
                    autoFocus
                  />
                </div>

                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Gender Identity</label>
                   <div className="flex flex-wrap gap-2 mt-2">
                     {['Female', 'Male', 'Non-Binary', 'Prefer not to say'].map(g => (
                       <button
                         key={g}
                         onClick={() => setFormData({...formData, gender: g as any})}
                         className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl text-sm font-semibold transition-all border-2 ${
                           formData.gender === g 
                             ? 'bg-black text-white border-black shadow-lg' 
                             : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300'
                         }`}
                       >
                         {g}
                       </button>
                     ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                            <Ruler size={14} className="text-blue-500" /> Height
                        </label>
                        <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded-md min-w-[60px] text-center">
                            {formData.heightCm} cm
                        </span>
                    </div>
                    <input 
                      type="range" min="140" max="220" 
                      value={formData.heightCm}
                      onChange={e => setFormData({...formData, heightCm: parseInt(e.target.value)})}
                      className="w-full accent-black h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                            <Weight size={14} className="text-purple-500" /> Weight
                        </label>
                        <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded-md min-w-[60px] text-center">
                             {formData.weightKg} kg
                        </span>
                    </div>
                    <input 
                      type="range" min="40" max="150" 
                      value={formData.weightKg}
                      onChange={e => setFormData({...formData, weightKg: parseInt(e.target.value)})}
                      className="w-full accent-black h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNext}
                disabled={!formData.name}
                className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              >
                Next Step <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: BODY SHAPE (SVG) */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Define your silhouette.</h2>
                <p className="text-gray-500">Select the shape that best matches your proportions.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {(SHAPE_OPTIONS[formData.gender || 'Male'] || SHAPE_OPTIONS['Male']).map((shape) => {
                  const isSelected = formData.bodyShape === shape.id;
                  
                  return (
                    <button
                      key={shape.id}
                      onClick={() => setFormData({...formData, bodyShape: shape.id as any})}
                      className={`
                        relative p-4 rounded-[2rem] border-2 transition-all duration-200 flex flex-col items-center gap-4 group
                        ${isSelected 
                            ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100 shadow-xl scale-105 z-10' 
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg'
                        }
                      `}
                    >
                       <ShapeIllustration 
                            shapeId={shape.id}
                            isSelected={isSelected} 
                       />
                       
                       <div className="flex flex-col items-center pb-2">
                           <span className={`text-sm font-bold transition-colors ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                {shape.label}
                           </span>
                           {isSelected && (
                               <motion.div layoutId="checkmark" className="mt-1 text-blue-500">
                                   <Check size={16} strokeWidth={3} />
                               </motion.div>
                           )}
                       </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={handleNext} className="w-full max-w-md mx-auto block bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-gray-800 transition-colors">
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 3: VIBE */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-3xl space-y-8"
            >
               <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">What's your vibe?</h2>
                <p className="text-gray-500">Select styles to help AI tune your recommendations.</p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {STYLE_CHIPS.map(style => {
                  const isSelected = formData.stylePreferences?.includes(style);
                  return (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className={`
                        px-6 py-3 rounded-full text-sm font-semibold transition-all border-2
                        ${isSelected 
                          ? 'bg-black text-white border-black shadow-lg scale-105' 
                          : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300 hover:text-gray-900'
                        }
                      `}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>

               <button 
                 onClick={handleNext} 
                 disabled={(formData.stylePreferences?.length || 0) === 0}
                 className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg disabled:opacity-50 shadow-xl hover:bg-gray-800 transition-colors"
               >
                Finish Setup
              </button>
            </motion.div>
          )}

          {/* STEP 4: COMPLETION LOADER */}
          {step === 4 && (
             <motion.div 
               key="step4"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-center space-y-8 py-10"
             >
                <div className="relative w-32 h-32 mx-auto">
                   {isSubmitting ? (
                     <>
                        <div className="absolute inset-0 border-4 border-gray-100 rounded-full" />
                        <div className="absolute inset-0 border-4 border-t-black border-r-black border-b-transparent border-l-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <User size={32} className="text-gray-300 animate-pulse" />
                        </div>
                     </>
                   ) : (
                     <motion.div 
                       initial={{ scale: 0 }} animate={{ scale: 1 }}
                       className="w-full h-full bg-black rounded-full flex items-center justify-center text-white shadow-2xl"
                     >
                       <Check size={48} strokeWidth={3} />
                     </motion.div>
                   )}
                </div>

                <div>
                   <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                     {isSubmitting ? 'Calibrating Style DNA...' : 'Profile Ready!'}
                   </h2>
                   <p className="text-gray-500 mt-2 text-lg">
                     {isSubmitting ? 'Analyzing your measurements for the perfect fit.' : 'Welcome to your new digital closet.'}
                   </p>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
