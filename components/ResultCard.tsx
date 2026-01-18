import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DrugInfo, Language } from '../types';
import { t } from '../translations';
import { 
  ArrowLeft, Volume2, StopCircle, AlertTriangle, 
  Pill, FileText, Thermometer, Info, ShieldCheck, HeartPulse
} from 'lucide-react';

interface ResultCardProps {
  info: DrugInfo;
  onBack: () => void;
  lang: Language;
}

export const ResultCard: React.FC<ResultCardProps> = ({ info, onBack, lang }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const T = t[lang];

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayAudio = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(info.summary);
    // Auto-detect voice language based on text, or default to current lang
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Sticky Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between"
      >
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="font-semibold text-slate-800 truncate max-w-[200px]">{info.name}</span>
        <div className="w-10"></div>
      </motion.div>

      {/* Main Content Area */}
      <motion.div 
        className="flex-1 overflow-y-auto p-4 pb-20 no-scrollbar space-y-4 max-w-3xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* 1. Hero Summary Card */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20">
            <HeartPulse size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                {T.ai_summary}
              </span>
              <button 
                onClick={handlePlayAudio}
                className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <>
                    <StopCircle size={16} /> <span>{T.stop}</span>
                  </>
                ) : (
                  <>
                    <Volume2 size={16} /> <span>{T.play}</span>
                  </>
                )}
              </button>
            </div>
            
            <h1 className="text-2xl font-bold mb-2 leading-tight">{info.name}</h1>
            <p className="text-blue-50 leading-relaxed text-sm opacity-90">
              {info.summary}
            </p>
          </div>
        </motion.div>

        {/* 2. Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Warning Card */}
          <motion.div variants={itemVariants} className="bg-red-50 rounded-2xl p-5 border border-red-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertTriangle size={20} />
              <h3>{T.contraindications}</h3>
            </div>
            <p className="text-slate-700 text-sm leading-6">
              {info.contraindications}
            </p>
          </motion.div>

          {/* Usage Tips */}
          <motion.div variants={itemVariants} className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-600 font-bold">
              <ShieldCheck size={20} />
              <h3>{T.tips}</h3>
            </div>
            <p className="text-slate-700 text-sm leading-6 whitespace-pre-line">
              {info.usage_tips}
            </p>
          </motion.div>

          {/* Dosage */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 text-blue-600 font-bold mb-3">
              <Pill size={20} />
              <h3>{T.dosage}</h3>
            </div>
            <div className="text-slate-600 text-sm leading-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
               {info.dosage}
            </div>
          </motion.div>

          {/* Indications */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-3">
              <FileText size={20} />
              <h3>{T.indications}</h3>
            </div>
            <p className="text-slate-600 text-sm leading-6">
              {info.indications}
            </p>
          </motion.div>

           {/* Side Effects */}
           <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600 font-bold mb-3">
              <Info size={20} />
              <h3>{T.side_effects}</h3>
            </div>
            <p className="text-slate-600 text-sm leading-6">
              {info.sideEffects}
            </p>
          </motion.div>

          {/* Storage */}
          <motion.div variants={itemVariants} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 md:col-span-2 flex items-center gap-4">
             <div className="bg-white p-3 rounded-full shadow-sm text-slate-500">
                <Thermometer size={20} />
             </div>
             <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{T.storage}</h4>
               <p className="text-slate-700 font-medium">{info.storage}</p>
             </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};