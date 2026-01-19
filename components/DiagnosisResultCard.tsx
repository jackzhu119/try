
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagnosisInfo, Language } from '../types';
import { t } from '../translations';
import { 
  ArrowLeft, Volume2, StopCircle, Stethoscope, 
  Activity, Thermometer, ShieldAlert, Utensils, HeartPulse, Sparkles, AlertCircle, Dna, Copy, Check, Type
} from 'lucide-react';
import { FollowUpChat } from './FollowUpChat';

interface DiagnosisResultCardProps {
  info: DiagnosisInfo;
  onBack: () => void;
  lang: Language;
}

// Optimization: Use React.memo to prevent re-renders when parent state (like Toast) changes
export const DiagnosisResultCard: React.FC<DiagnosisResultCardProps> = React.memo(({ info, onBack, lang }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
🩺 ${T.diagnosis_report}
⚠️ ${info.urgency}
---
📝 ${info.summary}
👉 ${info.potential_conditions.map(c => `${c.name} (${c.probability})`).join(', ')}
💊 ${T.rec_meds}: ${info.potential_conditions[0].medications.join(', ')}
🥗 ${T.lifestyle}: ${info.lifestyle_advice}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFontScale = () => {
    setFontScale(prev => (prev + 1) % 3);
  };

  // Theme based on urgency
  const getTheme = () => {
    switch (info.urgency) {
      case 'High':
        return {
          bg: 'from-rose-500 to-red-600',
          lightBg: 'bg-red-50',
          border: 'border-red-100',
          text: 'text-red-700',
          accent: 'bg-red-500',
          shadow: 'shadow-red-500/30'
        };
      case 'Medium':
        return {
          bg: 'from-amber-400 to-orange-500',
          lightBg: 'bg-orange-50',
          border: 'border-orange-100',
          text: 'text-orange-800',
          accent: 'bg-orange-500',
          shadow: 'shadow-orange-500/30'
        };
      default: // Low
        return {
          bg: 'from-emerald-400 to-teal-500',
          lightBg: 'bg-emerald-50',
          border: 'border-emerald-100',
          text: 'text-emerald-800',
          accent: 'bg-emerald-500',
          shadow: 'shadow-emerald-500/30'
        };
    }
  };

  const theme = getTheme();
  const selectedCondition = info.potential_conditions[selectedIndex];

  // Animation Variants
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

  const tabContentVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const chatContext = JSON.stringify(info);

  // Dynamic style for main content wrapper
  const contentStyle = {
    fontSize: fontScale === 0 ? '100%' : fontScale === 1 ? '115%' : '130%'
  };

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden bg-slate-50">
      
      {/* Decorative Side Elements for Large Screens */}
      <div className="hidden xl:block absolute top-1/2 left-10 -translate-y-1/2 opacity-[0.04] pointer-events-none select-none">
         <Stethoscope size={400} className="text-indigo-800" />
      </div>
      <div className="hidden xl:block absolute bottom-10 right-10 opacity-[0.04] pointer-events-none select-none">
         <Dna size={400} className="-rotate-12 text-indigo-800" />
      </div>

      {/* Sticky Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="font-semibold text-slate-800 flex items-center gap-2">
            <Stethoscope size={18} className="text-blue-500"/>
            {T.diagnosis_report}
          </span>
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

      {/* Content */}
      <motion.div 
        className="flex-1 overflow-y-auto p-4 pb-20 no-scrollbar space-y-6 max-w-5xl mx-auto w-full relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div style={contentStyle} className="transition-all duration-300">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           
           {/* Left Column (Diagnosis) */}
           <div className="lg:col-span-2 space-y-6">
              
              {/* Urgency & Summary Card */}
              <motion.div variants={itemVariants} className={`bg-gradient-to-br ${theme.bg} rounded-3xl p-6 text-white shadow-xl ${theme.shadow} relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Activity size={120} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[0.75em] font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1">
                      {info.urgency === 'High' ? T.urgency_high : info.urgency === 'Medium' ? T.urgency_med : T.urgency_low}
                    </span>
                    <button 
                      onClick={handlePlayAudio}
                      className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-full font-bold text-[0.8em] shadow-lg transition-all active:scale-95"
                    >
                      {isPlaying ? <StopCircle size={14} /> : <Volume2 size={14} />}
                      <span>{T.play}</span>
                    </button>
                  </div>
                  
                  <h1 className="text-[1.75em] font-bold mb-2 flex items-center gap-2">
                    <Sparkles size={24} className="opacity-80"/>
                    {T.preliminary_analysis}
                  </h1>
                  <p className="text-white/90 leading-relaxed text-[0.95em]">
                    {info.summary}
                  </p>
                </div>
              </motion.div>

              {/* --- Interactive Condition Tabs --- */}
              <motion.div variants={itemVariants}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <ShieldAlert size={'1.2em'} className="text-slate-500"/>
                  <h3 className="text-[1em] font-bold text-slate-500 uppercase tracking-wider">{T.possible_causes}</h3>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {info.potential_conditions.map((condition, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedIndex(index)}
                      className="relative flex-shrink-0 px-5 py-3 rounded-2xl transition-all outline-none"
                    >
                      {selectedIndex === index && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white shadow-md border border-slate-100 rounded-2xl"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-start gap-1">
                        <span className={`font-bold text-[0.9em] ${selectedIndex === index ? 'text-slate-800' : 'text-slate-400'}`}>
                          {condition.name}
                        </span>
                        <span className={`text-[0.75em] px-1.5 py-0.5 rounded-md font-medium ${
                          selectedIndex === index 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {condition.probability}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Tab Content Area */}
                <div className="mt-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[300px]">
                  <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedIndex}
                        variants={tabContentVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {/* Explanation */}
                        <div>
                          <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2 text-[1.1em]">
                            <AlertCircle size={'1em'} className="text-blue-500"/>
                            {T.pathology}
                          </h4>
                          <p className="text-slate-600 text-[0.95em] leading-relaxed bg-slate-50 p-3 rounded-xl">
                            {selectedCondition.explanation}
                          </p>
                        </div>

                        <div className="w-full h-px bg-slate-100 my-4"></div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Medications */}
                          <div>
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-[1.1em]">
                              <Thermometer size={'1em'} className="text-purple-500"/>
                              {T.rec_meds}
                            </h4>
                            {selectedCondition.medications.length > 0 ? (
                              <ul className="space-y-2">
                                {selectedCondition.medications.map((med, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-[0.9em] text-slate-700 bg-purple-50/50 p-2 rounded-lg border border-purple-100/50">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                    {med}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[0.9em] text-slate-400 italic">{T.no_meds}</p>
                            )}
                          </div>

                          {/* Treatments */}
                          <div>
                            <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3 text-[1.1em]">
                              <HeartPulse size={'1em'} className="text-emerald-500"/>
                              {T.adj_treatment}
                            </h4>
                            {selectedCondition.treatments.length > 0 ? (
                              <ul className="space-y-2">
                                {selectedCondition.treatments.map((t, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-[0.9em] text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                    {t}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-[0.9em] text-slate-400 italic">{T.no_treatments}</p>
                            )}
                          </div>
                        </div>

                      </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Generic Lifestyle Advice */}
              <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2 text-[1.1em]">
                  <Utensils size={'1.2em'} />
                  <h3>{T.lifestyle}</h3>
                </div>
                <p className="text-slate-700 text-[0.95em] leading-relaxed">
                  {info.lifestyle_advice}
                </p>
              </motion.div>

              {/* Disclaimer Footer */}
              <motion.div variants={itemVariants} className="flex gap-3 bg-slate-100 rounded-xl p-4 text-[0.8em] text-slate-500 items-start">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <p>
                  <strong>{T.disclaimer_title}</strong> {T.disclaimer_text}
                </p>
              </motion.div>
           </div>

           {/* Right Column: AI Chat (Takes 1/3) */}
           <motion.div variants={itemVariants} className="lg:col-span-1 h-full min-h-[400px]">
              <div className="sticky top-20 h-[calc(100vh-140px)] min-h-[400px]">
                 <FollowUpChat 
                    contextText={chatContext} 
                    lang={lang}
                    suggestions={[T.suggested_q1_diag, T.suggested_q2_diag]}
                  />
              </div>
           </motion.div>

         </div>
         </div>
      </motion.div>
    </div>
  );
});
