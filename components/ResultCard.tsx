
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrugInfo, Language } from '../types';
import { t } from '../translations';
import { 
  ArrowLeft, Volume2, StopCircle, AlertTriangle, 
  Pill, FileText, Thermometer, Info, ShieldCheck, HeartPulse, Activity, Copy, Check, Type
} from 'lucide-react';
import { FollowUpChat } from './FollowUpChat';

interface ResultCardProps {
  info: DrugInfo;
  onBack: () => void;
  lang: Language;
}

// Optimization: Use React.memo to prevent re-renders when parent state (like Toast) changes
export const ResultCard: React.FC<ResultCardProps> = React.memo(({ info, onBack, lang }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  // Font scaling state: 0 (100%), 1 (115%), 2 (130%)
  const [fontScale, setFontScale] = useState(0); 
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
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    const text = `
💊 ${info.name}
---
📝 ${T.indications}: ${info.indications}
💊 ${T.dosage}: ${info.dosage}
⚠️ ${T.contraindications}: ${info.contraindications}
ℹ️ ${T.side_effects}: ${info.sideEffects}
💡 ${T.tips}: ${info.usage_tips}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFontScale = () => {
    setFontScale(prev => (prev + 1) % 3);
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

  // Construct context for the chat
  const chatContext = JSON.stringify(info);

  // Dynamic style for main content wrapper
  const contentStyle = {
    fontSize: fontScale === 0 ? '100%' : fontScale === 1 ? '115%' : '130%'
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Decorative Side Elements for Large Screens */}
      <div className="hidden xl:block absolute top-1/2 left-10 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
         <Pill size={400} className="-rotate-12 text-blue-800" />
      </div>
      <div className="hidden xl:block absolute bottom-0 right-10 opacity-[0.04] pointer-events-none select-none">
         <Activity size={400} className="text-blue-800" />
      </div>

      {/* Sticky Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-[300px]">{info.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Font Size Toggle */}
          <button 
            onClick={toggleFontScale}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-all flex items-center justify-center relative"
            title={T.font_size}
          >
             <Type size={20} />
             {fontScale > 0 && (
               <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                 {fontScale === 1 ? '+' : '++'}
               </span>
             )}
          </button>

          {/* Copy Button */}
          <button 
            onClick={handleCopy}
            className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-all flex items-center gap-1 active:scale-95"
            title={T.copy_report}
          >
             <AnimatePresence mode="wait">
               {copied ? (
                 <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check size={20} />
                 </motion.div>
               ) : (
                 <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Copy size={20} />
                 </motion.div>
               )}
             </AnimatePresence>
          </button>
        </div>
      </motion.div>

      {/* Main Content Area - Wrapped for Font Scaling */}
      <motion.div 
        className="flex-1 overflow-y-auto p-4 pb-20 no-scrollbar space-y-4 max-w-4xl mx-auto w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div style={contentStyle} className="transition-all duration-300">
          
          {/* 1. Hero Summary Card */}
          <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden mb-4">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <HeartPulse size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[0.75em] font-medium border border-white/10">
                  {T.ai_summary}
                </span>
                <button 
                  onClick={handlePlayAudio}
                  className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-full font-bold text-[0.85em] shadow-lg hover:scale-105 transition-transform"
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
              
              <h1 className="text-[1.75em] font-bold mb-2 leading-tight">{info.name}</h1>
              <p className="text-blue-50 leading-relaxed text-[0.95em] opacity-90">
                {info.summary}
              </p>
            </div>
          </motion.div>

          {/* 2. Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left Column: Info Cards (Takes 2/3 on large screens) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Warning Card */}
              <motion.div variants={itemVariants} className="bg-red-50 rounded-2xl p-5 border border-red-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-red-600 font-bold text-[1.1em]">
                  <AlertTriangle size={'1.2em'} />
                  <h3>{T.contraindications}</h3>
                </div>
                <p className="text-slate-700 text-[0.95em] leading-relaxed">
                  {info.contraindications}
                </p>
              </motion.div>

              {/* Usage Tips */}
              <motion.div variants={itemVariants} className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-600 font-bold text-[1.1em]">
                  <ShieldCheck size={'1.2em'} />
                  <h3>{T.tips}</h3>
                </div>
                <p className="text-slate-700 text-[0.95em] leading-relaxed whitespace-pre-line">
                  {info.usage_tips}
                </p>
              </motion.div>

              {/* Dosage */}
              <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 font-bold mb-3 text-[1.1em]">
                  <Pill size={'1.2em'} />
                  <h3>{T.dosage}</h3>
                </div>
                <div className="text-slate-600 text-[0.95em] leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {info.dosage}
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Indications */}
                  <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold mb-3 text-[1.1em]">
                      <FileText size={'1.2em'} />
                      <h3>{T.indications}</h3>
                    </div>
                    <p className="text-slate-600 text-[0.95em] leading-relaxed">
                      {info.indications}
                    </p>
                  </motion.div>

                  {/* Side Effects */}
                  <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 text-purple-600 font-bold mb-3 text-[1.1em]">
                      <Info size={'1.2em'} />
                      <h3>{T.side_effects}</h3>
                    </div>
                    <p className="text-slate-600 text-[0.95em] leading-relaxed">
                      {info.sideEffects}
                    </p>
                  </motion.div>
              </div>

              {/* Storage */}
              <motion.div variants={itemVariants} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex items-center gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-slate-500">
                    <Thermometer size={'1.5em'} />
                </div>
                <div>
                  <h4 className="text-[0.8em] font-bold text-slate-400 uppercase tracking-wider">{T.storage}</h4>
                  <p className="text-slate-700 font-medium text-[1em]">{info.storage}</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column: AI Chat Assistant (Takes 1/3 on large screens) */}
            <motion.div variants={itemVariants} className="lg:col-span-1 h-full min-h-[400px]">
              <div className="sticky top-20 h-[calc(100vh-140px)] min-h-[400px]">
                  <FollowUpChat 
                    contextText={chatContext} 
                    lang={lang} 
                    suggestions={[T.suggested_q1_drug, T.suggested_q2_drug]}
                  />
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </div>
  );
});
