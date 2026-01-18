import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DiagnosisInfo } from '../types';
import { 
  ArrowLeft, Volume2, StopCircle, Stethoscope, 
  Activity, Thermometer, ShieldAlert, Utensils, HeartPulse, CheckCircle2
} from 'lucide-react';

interface DiagnosisResultCardProps {
  info: DiagnosisInfo;
  onBack: () => void;
}

export const DiagnosisResultCard: React.FC<DiagnosisResultCardProps> = ({ info, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);

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
          icon: 'text-red-500',
          shadow: 'shadow-red-500/30'
        };
      case 'Medium':
        return {
          bg: 'from-amber-400 to-orange-500',
          lightBg: 'bg-orange-50',
          border: 'border-orange-100',
          text: 'text-orange-800',
          icon: 'text-orange-500',
          shadow: 'shadow-orange-500/30'
        };
      default: // Low
        return {
          bg: 'from-emerald-400 to-teal-500',
          lightBg: 'bg-emerald-50',
          border: 'border-emerald-100',
          text: 'text-emerald-800',
          icon: 'text-emerald-500',
          shadow: 'shadow-emerald-500/30'
        };
    }
  };

  const theme = getTheme();

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
        className="flex-1 overflow-y-auto p-4 pb-20 no-scrollbar space-y-5 max-w-3xl mx-auto w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Urgency Card */}
        <motion.div variants={itemVariants} className={`bg-gradient-to-br ${theme.bg} rounded-3xl p-6 text-white shadow-xl ${theme.shadow} relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Activity size={100} />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1">
                 {info.urgency === 'High' ? '⚠️ 建议就医' : info.urgency === 'Medium' ? '👀 密切观察' : '✅ 居家护理'}
              </span>
              <button 
                onClick={handlePlayAudio}
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-800 px-3 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all"
              >
                {isPlaying ? <StopCircle size={14} /> : <Volume2 size={14} />}
                <span>听报告</span>
              </button>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              {info.conditions[0]} 
              {info.conditions.length > 1 && <span className="text-lg opacity-80 font-normal"> 可能</span>}
            </h1>
            <p className="text-white/90 leading-relaxed text-sm">
              {info.summary}
            </p>
          </div>
        </motion.div>

        {/* Possible Conditions List */}
        <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-blue-600 font-bold mb-3">
             <ShieldAlert size={20} />
             <h3>可能性分析</h3>
          </div>
          <div className="flex flex-wrap gap-2">
             {info.conditions.map((condition, idx) => (
               <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                 {condition}
               </span>
             ))}
          </div>
          <p className="mt-3 text-slate-600 text-sm leading-6 border-t border-slate-50 pt-3">
            {info.explanation}
          </p>
        </motion.div>

        {/* Treatment & Meds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Medications */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600 font-bold mb-3">
              <Thermometer size={20} />
              <h3>推荐用药 (OTC)</h3>
            </div>
            <ul className="space-y-2">
              {info.medications.map((med, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  {med}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Non-drug treatments */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-600 font-bold mb-3">
              <HeartPulse size={20} />
              <h3>辅助治疗</h3>
            </div>
            <ul className="space-y-2">
              {info.treatments.map((t, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Lifestyle Advice */}
        <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-2 text-indigo-700 font-bold mb-2">
            <Utensils size={20} />
            <h3>生活建议</h3>
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