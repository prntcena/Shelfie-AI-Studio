
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Ruler, Weight, User, Check, Upload, ChevronRight, Users } from 'lucide-react';
import { UserProfile } from '../types';

interface AvatarSetupProps {
  currentProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel: () => void;
}

const BODY_SHAPES = ['Hourglass', 'Pear', 'Rectangle', 'Inverted Triangle', 'Athletic'];
const SKIN_TONES = ['Fair', 'Light', 'Medium', 'Tan', 'Deep'];
const GENDERS = ['Female', 'Male', 'Non-Binary', 'Prefer not to say'];

export const AvatarSetup: React.FC<AvatarSetupProps> = ({ currentProfile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: currentProfile.gender || 'Female',
    heightCm: currentProfile.heightCm || 170,
    weightKg: currentProfile.weightKg || 65,
    bodyShape: currentProfile.bodyShape || 'Rectangle',
    skinTone: currentProfile.skinTone || 'Medium',
    facePhoto: currentProfile.facePhoto || ''
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, facePhoto: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.facePhoto) return alert("Please upload a selfie for the best results.");
    onSave({ ...currentProfile, ...formData } as UserProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        
        {/* Left: Photo Upload */}
        <div className="w-full md:w-5/12 bg-gray-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 relative">
           <h3 className="text-lg font-bold text-gray-900 mb-6 absolute top-6 left-6">Your Digital Twin</h3>
           
           <label className="cursor-pointer group relative">
             <div className="w-48 h-64 bg-gray-200 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-blue-500 transition-colors flex items-center justify-center">
                {formData.facePhoto ? (
                    <img src={formData.facePhoto} alt="Face" className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-4">
                        <Camera className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">Upload a clear selfie</p>
                    </div>
                )}
             </div>
             <div className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-md group-hover:scale-110 transition-transform">
                <Upload size={16} className="text-gray-700" />
             </div>
             <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
           </label>
           <p className="text-[10px] text-gray-400 mt-4 text-center px-4">
               Privacy Note: Your biometric data is stored locally in your browser.
           </p>
        </div>

        {/* Right: Measurements */}
        <div className="w-full md:w-7/12 p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Measurements</h3>
                <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-900">Cancel</button>
            </div>

            <div className="space-y-6">
                
                {/* Gender */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <Users size={14} /> Gender
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {GENDERS.map(g => (
                            <button
                                key={g}
                                onClick={() => setFormData({...formData, gender: g as any})}
                                className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                    formData.gender === g
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                                    : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400">Used to generate accurate body silhouettes.</p>
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Ruler size={14} /> Height (cm)
                        </label>
                        <input 
                            type="number" 
                            value={formData.heightCm}
                            onChange={(e) => setFormData({...formData, heightCm: parseInt(e.target.value)})}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <Weight size={14} /> Weight (kg)
                        </label>
                        <input 
                            type="number" 
                            value={formData.weightKg}
                            onChange={(e) => setFormData({...formData, weightKg: parseInt(e.target.value)})}
                            className="w-full bg-gray-50 rounded-xl px-4 py-3 font-medium text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Body Shape */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                        <User size={14} /> Body Shape
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {BODY_SHAPES.map(shape => (
                            <button
                                key={shape}
                                onClick={() => setFormData({...formData, bodyShape: shape as any})}
                                className={`px-2 py-2 text-xs rounded-lg border transition-all ${
                                    formData.bodyShape === shape 
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' 
                                    : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {shape}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Skin Tone */}
                <div className="space-y-2">
                     <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Skin Tone</label>
                     <div className="flex gap-3">
                         {SKIN_TONES.map(tone => {
                             let color = '#F3E5DC'; // Fair
                             if (tone === 'Light') color = '#E8D2C2';
                             if (tone === 'Medium') color = '#C69C7F';
                             if (tone === 'Tan') color = '#8D5B3E';
                             if (tone === 'Deep') color = '#4F3124';
                             
                             return (
                                 <button
                                    key={tone}
                                    onClick={() => setFormData({...formData, skinTone: tone})}
                                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                                        formData.skinTone === tone ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    title={tone}
                                 />
                             );
                         })}
                     </div>
                </div>

            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                    onClick={handleSave}
                    className="w-full bg-black text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg"
                >
                    Save Dimensions <Check size={18} />
                </button>
            </div>
        </div>

      </motion.div>
    </div>
  );
};