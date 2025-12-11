
import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, Loader2, Layers, CheckCircle2 } from 'lucide-react';
import { analyzeClothingImage } from '../services/gemini';
import { ClothingItem, AIAnalysisResult } from '../types';

interface ImageUploaderProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (item: ClothingItem) => void;
  onBatchItem: (item: ClothingItem) => void;
  onBatchComplete: (count: number) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onAnalysisStart, 
  onAnalysisComplete,
  onBatchItem,
  onBatchComplete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  
  // Single Upload State
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Batch Upload State
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchSuccessCount, setBatchSuccessCount] = useState(0);

  // Helper: Convert File to Base64 Promise
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const createItemFromAnalysis = (base64: string, analysis: AIAnalysisResult): ClothingItem => {
    return {
      id: crypto.randomUUID(),
      image: base64,
      category: analysis.category,
      subCategory: analysis.subCategory,
      primaryColor: analysis.primaryColor,
      season: analysis.season,
      tags: analysis.styleTags,
      createdAt: Date.now(),
    };
  };

  // --- LOGIC: SINGLE FILE ---
  const processSingleFile = async (file: File) => {
    setIsAnalyzing(true);
    onAnalysisStart();

    try {
      const base64 = await readFileAsBase64(file);
      const analysis: AIAnalysisResult = await analyzeClothingImage(base64);
      const newItem = createItemFromAnalysis(base64, analysis);
      onAnalysisComplete(newItem);
    } catch (error) {
      console.error("Single processing failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- LOGIC: BATCH FILES ---
  const processBatchFiles = async (files: File[]) => {
    setIsBatchProcessing(true);
    setBatchTotal(files.length);
    setBatchProgress(0);
    setBatchSuccessCount(0);
    let successCount = 0;

    // Process sequentially to avoid rate limits and provide smooth UI
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setBatchProgress(prev => prev + 1);
        continue;
      }

      try {
        const base64 = await readFileAsBase64(file);
        const analysis = await analyzeClothingImage(base64);
        const newItem = createItemFromAnalysis(base64, analysis);
        
        // Immediate Auto-Save
        onBatchItem(newItem);
        successCount++;
        setBatchSuccessCount(successCount);

      } catch (error) {
        console.error(`Batch processing failed for file ${i + 1}`, error);
      }

      setBatchProgress(i + 1);
    }

    // Finish
    setTimeout(() => {
        setIsBatchProcessing(false);
        onBatchComplete(successCount);
        setBatchTotal(0);
        setBatchProgress(0);
    }, 1000); // Small delay to show 100% completion
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    const files = Array.from(fileList);
    
    // Logic Branching: Single vs Batch
    if (files.length === 1) {
      processSingleFile(files[0]);
    } else {
      processBatchFiles(files);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so same files can be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-12" id="upload-zone">
      <motion.label
        layout
        htmlFor="file-upload"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-64 
          rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden
          transition-colors duration-300 ease-out
          ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}
        `}
        whileHover={!isAnalyzing && !isBatchProcessing ? { scale: 1.01 } : {}}
        whileTap={!isAnalyzing && !isBatchProcessing ? { scale: 0.98 } : {}}
      >
        <AnimatePresence mode="wait">
            
          {/* STATE 1: BATCH PROCESSING */}
          {isBatchProcessing ? (
             <motion.div
               key="batch-processing"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="w-full max-w-sm px-6 flex flex-col items-center gap-4 z-10"
             >
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center relative">
                    <Layers className="text-blue-600 w-8 h-8" />
                    <motion.div 
                        className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"
                        style={{ borderRightColor: 'transparent' }} 
                    />
                </div>
                
                <div className="w-full text-center space-y-2">
                    <h3 className="font-bold text-gray-900 text-lg">Batch Analyzing...</h3>
                    <p className="text-gray-500 text-sm">
                        Processing item {Math.min(batchProgress + 1, batchTotal)} of {batchTotal}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                        className="h-full bg-blue-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(batchProgress / batchTotal) * 100}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    />
                </div>
                
                <div className="flex gap-2 items-center text-xs text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                    <CheckCircle2 size={12} /> {batchSuccessCount} items saved to closet
                </div>
             </motion.div>
          ) 
          
          /* STATE 2: SINGLE ANALYZING */
          : isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 z-10"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 animate-pulse" />
                <Sparkles className="w-10 h-10 text-blue-500 animate-spin-slow" />
              </div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Analyzing Style...
              </p>
            </motion.div>
          ) 
          
          /* STATE 3: IDLE */
          : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-center p-6"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center shadow-sm relative group-hover:scale-105 transition-transform duration-300">
                <Upload className="w-8 h-8 text-gray-400 group-hover:text-gray-600 transition-colors" />
                
                {/* Badge for Batch */}
                <div className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                    Batch Ready
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Drop your look here</p>
                <p className="text-sm text-gray-500 mt-1">
                    Drag multiple photos for <span className="font-semibold text-blue-600">Batch Upload</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input 
          id="file-upload" 
          type="file" 
          className="hidden" 
          accept="image/*"
          multiple // Enabled multiple selection
          onChange={handleFileInput}
          disabled={isAnalyzing || isBatchProcessing}
        />
      </motion.label>
    </div>
  );
};
