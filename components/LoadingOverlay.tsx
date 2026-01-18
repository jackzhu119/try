import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Database, ScanLine, CheckCircle2, Stethoscope, HeartPulse, FileText, Search } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  type: 'DRUG' | 'DIAGNOSIS';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ type }) => {
  const [phase, setPhase] = useState(0);

  // Configuration for Drug Search Mode (Blue/Cyan/Purple Theme)
  const drugPhases = [
    { text: "启动视觉神经...", icon: ScanLine, color: "text-blue-400" },
    { text: "解析药品特征...", icon: Search, color: "text-cyan-400" },
    { text: "检索全球药典...", icon: Database, color: "text-purple-400" },
    { text: "生成用药指引...", icon: FileText, color: "text-indigo-400" },
    { text: "即将完成...", icon: CheckCircle2, color: "text-blue-500" },
  ];

  // Configuration for Diagnosis Mode (Indigo/Rose/Amber Theme)
  const diagnosisPhases = [
    { text: "连接 AI 医疗大脑...", icon: Brain, color: "text-indigo-400" },
    { text: "分析症状描述...", icon: Stethoscope, color: "text-rose-400" },
    { text: "匹配病理模型...", icon: Activity, color: "text-amber-400" },
    { text: "生成诊断建议...", icon: HeartPulse, color: "text-emerald-400" },
    { text: "整理康复方案...", icon: CheckCircle2, color: "text-indigo-500" },
  ];

  const currentPhases = type === 'DIAGNOSIS' ? diagnosisPhases : drugPhases;
  
  // Theme colors based on mode
  const theme = type === 'DIAGNOSIS' 
    ? {
        gradient: "from-indigo-600 to-rose-600",
        shadow: "shadow-[0_0_50px_rgba(225,29,72,0.5)]",
        ring1: "border-t-rose-500",
        ring2: "border-b-indigo-500",
        bar: "from-indigo-500 to-rose-500",
        particle: "bg-rose-400 shadow-[0_0_10px_#fb7185]"
      }
    : {
        gradient: "from-blue-600 to-cyan-600",
        shadow: "shadow-[0_0_50px_rgba(59,130,246,0.5)]",
        ring1: "border-t-blue-500",
        ring2: "border-b-cyan-500",
        bar: "from-blue-500 to-cyan-500",
        particle: "bg-blue-400 shadow-[0_0_10px_#60a5fa]"
      };

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p < currentPhases.length - 1 ? p + 1 : p));
    }, 1500); // Slightly faster transitions
    return () => clearInterval(interval);
  }, [currentPhases.length]);

  const ActiveIcon = currentPhases[phase].icon;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl text-white"
    >
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className={`absolute top-0 left-0 w-full h-full bg-gradient-radial ${type === 'DIAGNOSIS' ? 'from-indigo-900/30' : 'from-blue-900/30'} via-transparent to-transparent`}
        />
      </div>

      {/* Main Visual */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-12">
        {/* Outer Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-0 rounded-full border border-slate-700/50 ${theme.ring1} border-l-transparent`}
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className={`absolute inset-4 rounded-full border border-slate-700/50 ${theme.ring2} border-r-transparent`}
        />
        
        {/* Pulsing Core */}
        <motion.div 
          animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr ${theme.gradient} flex items-center justify-center ${theme.shadow}`}
        >
          <AnimatePresence mode="wait">
             <motion.div
               key={`${type}-${phase}`}
               initial={{ scale: 0, opacity: 0, rotate: -20 }}
               animate={{ scale: 1, opacity: 1, rotate: 0 }}
               exit={{ scale: 0, opacity: 0, rotate: 20 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
             >
               <ActiveIcon size={48} className="text-white drop-shadow-md" />
             </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Orbiting Particles */}
        <div className="absolute inset-0 animate-spin-slow">
           <div className={`absolute top-0 left-1/2 w-3 h-3 rounded-full ${theme.particle}`}></div>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative z-10 text-center space-y-4 px-6 max-w-sm">
        <motion.h2 
          key={`${type}-${phase}-text`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400`}
        >
          {currentPhases[phase].text}
        </motion.h2>
        
        <p className="text-slate-400 text-sm font-mono flex justify-center items-center gap-2 uppercase tracking-widest">
          <span className={`w-2 h-2 rounded-full animate-pulse ${type === 'DIAGNOSIS' ? 'bg-rose-500' : 'bg-green-500'}`}></span>
          AI Model Processing
        </p>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-8">
          <motion.div 
            className={`h-full bg-gradient-to-r ${theme.bar}`}
            initial={{ width: "0%" }}
            animate={{ width: `${((phase + 1) / currentPhases.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};