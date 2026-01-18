import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DiagnosisInfo } from '../types';
import { 
  ArrowLeft, Volume2, StopCircle, Stethoscope, 
  Activity, Thermometer, ShieldAlert, Utensils, HeartPulse, Sparkles, AlertCircle
} from 'lucide-react';

interface DiagnosisResultCardProps {
  info: DiagnosisInfo;
  onBack: () => void;
}

export const DiagnosisResultCard: React.FC<DiagnosisResultCardProps> = ({ info, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
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

  return (
    <div className="w-full h-full flex flex-col relative bg-slate-50">
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
        <span className="font-semibold text-slate-800 flex items-center gap-2">
           <Stethoscope size={18} className="text-blue-500"/>
           AI 诊断报告
        </span>
        <div className="w-10"></div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="flex-1 overflow-y-auto p-4 pb-20 no-scrollbar space-y-6 max-w-3xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Urgency & Summary Card */}
        <motion.div variants={itemVariants} className={`bg-gradient-to-br ${theme.bg} rounded-3xl p-6 text-white shadow-xl ${theme.shadow} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Activity size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1">
                 {info.urgency === 'High' ? '⚠️ 建议就医' : info.urgency === 'Medium' ? '👀 密切观察' : '✅ 居家护理'}
              </span>
              <button 
                onClick={handlePlayAudio}
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all active:scale-95"
              >
                {isPlaying ? <StopCircle size={14} /> : <Volume2 size={14} />}
                <span>听报告</span>
              </button>
            </div>
            
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Sparkles size={24} className="opacity-80"/>
              初步诊断分析
            </h1>
            <p className="text-white/90 leading-relaxed text-sm">
              {info.summary}
            </p>
          </div>
        </motion.div>

        {/* --- Interactive Condition Tabs --- */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-2 mb-3 px-1">
             <ShieldAlert size={18} className="text-slate-500"/>
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">可能的病因分析</h3>
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
                  <span className={`font-bold text-sm ${selectedIndex === index ? 'text-slate-800' : 'text-slate-400'}`}>
                    {condition.name}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                    selectedIndex === index 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    可能性: {condition.probability}
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
                    <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-2">
                      <AlertCircle size={18} className="text-blue-500"/>
                      病理分析
                    </h4>
                    <p className="text-slate-600 text-sm leading-6 bg-slate-50 p-3 rounded-xl">
                      {selectedCondition.explanation}
                    </p>
                  </div>

                  <div className="w-full h-px bg-slate-100 my-4"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Medications */}
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                        <Thermometer size={18} className="text-purple-500"/>
                        推荐药物 (OTC)
                      </h4>
                      {selectedCondition.medications.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedCondition.medications.map((med, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-purple-50/50 p-2 rounded-lg border border-purple-100/50">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                              {med}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">暂无非处方药建议</p>
                      )}
                    </div>

                    {/* Treatments */}
                    <div>
                      <h4 className="flex items-center gap-2 font-bold text-slate-800 mb-3">
                        <HeartPulse size={18} className="text-emerald-500"/>
                        辅助治疗
                      </h4>
                       {selectedCondition.treatments.length > 0 ? (
                        <ul className="space-y-2">
                          {selectedCondition.treatments.map((t, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              {t}
                            </li>
                          ))}
                        </ul>
                       ) : (
                        <p className="text-sm text-slate-400 italic">暂无特殊物理治疗建议</p>
                       )}
                    </div>
                  </div>

                </motion.div>
             </AnimatePresence>
          </div>
        </motion.div>

        {/* Generic Lifestyle Advice */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
            <Utensils size={20} />
            <h3>通用生活建议</h3>
          </div>
          <p className="text-slate-700 text-sm leading-6">
            {info.lifestyle_advice}
          </p>
        </motion.div>

        {/* Disclaimer Footer */}
        <motion.div variants={itemVariants} className="flex gap-3 bg-slate-100 rounded-xl p-4 text-xs text-slate-500 items-start">
           <ShieldAlert size={16} className="shrink-0 mt-0.5" />
           <p>
             <strong>免责声明：</strong> AI 分析结果仅供参考，不能替代专业医生的当面诊断。如果症状持续加重或出现呼吸困难、剧烈疼痛等情况，请立即前往医院就诊。
           </p>
        </motion.div>

      </motion.div>
    </div>
  );
};