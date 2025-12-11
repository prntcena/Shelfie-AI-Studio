
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Sparkles, Trash2, ChevronRight, ToggleRight, ToggleLeft } from 'lucide-react';
import { UserProfile } from '../types';

interface StyleProfileProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onClearData: () => void;
}

export const StyleProfile: React.FC<StyleProfileProps> = ({ profile, onUpdateProfile, onClearData }) => {
  const [tagInput, setTagInput] = useState('');

  const handleToggleAI = () => {
    onUpdateProfile({ ...profile, allowPersonalization: !profile.allowPersonalization });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      onUpdateProfile({
        ...profile,
        stylePreferences: [...(profile.stylePreferences || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onUpdateProfile({
      ...profile,
      stylePreferences: (profile.stylePreferences || []).filter(t => t !== tag)
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
      
      {/* Hero Header */}
      <div className="text-center mb-10 pt-4">
        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mx-auto flex items-center justify-center shadow-inner mb-4 relative overflow-hidden">
             {profile.facePhoto ? (
                 <img src={profile.facePhoto} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <User size={40} className="text-gray-400" />
             )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
        <div className="flex justify-center gap-2 mt-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                {profile.bodyShape}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600 font-medium">
                {profile.heightCm}cm
            </span>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* Section: AI Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Sparkles size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-900">Style Intelligence</h3>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="pr-4">
                    <p className="font-medium text-gray-900">Personalize Recommendations</p>
                    <p className="text-xs text-gray-500 mt-1">Allow Shelfie to analyze your wardrobe patterns to suggest better outfits. All processing happens locally.</p>
                </div>
                <button onClick={handleToggleAI} className="transition-colors duration-200">
                    {profile.allowPersonalization ? (
                        <ToggleRight size={40} className="text-green-500" />
                    ) : (
                        <ToggleLeft size={40} className="text-gray-300" />
                    )}
                </button>
            </div>
          </div>
        </div>

        {/* Section: Style Tags */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <User size={18} className="text-purple-500" />
            <h3 className="font-semibold text-gray-900">Your Style DNA</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-500 mb-4">Add keywords that define your aesthetic (e.g., 'Minimal', '90s', 'Professional').</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {(profile.stylePreferences || []).map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={12} /></button>
                    </span>
                ))}
            </div>
            <input 
                type="text" 
                placeholder="Type and press Enter..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Section: Danger Zone */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Shield size={18} className="text-gray-400" />
            <h3 className="font-semibold text-gray-900">Data & Privacy</h3>
          </div>
          <div className="p-6">
             <button 
                onClick={() => {
                    if(confirm("Are you sure? This will delete all your clothes, outfits, and plans permanently.")) {
                        onClearData();
                    }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
             >
                 <span className="font-medium flex items-center gap-2"><Trash2 size={16} /> Clear All App Data</span>
                 <ChevronRight size={16} />
             </button>
             <p className="text-xs text-gray-400 mt-3 text-center">Shelfie V1.0.3 (Phase 6)</p>
          </div>
        </div>

      </div>
    </div>
  );
};

const X: React.FC<{ size?: number, className?: string }> = ({ size = 24, className = "" }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
);
