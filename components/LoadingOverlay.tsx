import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Database, ScanLine, CheckCircle2 } from 'lucide-react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  const [phase, setPhase] = useState(0);

  const phases = [
    { text: "建立安全连接...", icon: Activity, color: "text-blue-400" },
    { text: "分析图像特征...", icon: ScanLine, color: "text-purple-400" },
    { text: "检索全球药典...", icon: Database, color: "text-amber-400" },
    { text: "生成用药指引...", icon: Brain, color: "text-emerald-400" },
    { text: "即将完成...", icon: CheckCircle2, color: "text-blue-500" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p < phases.length - 1 ? p + 1 : p));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const ActiveIcon = phases[phase].icon;

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
          className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-blue-900/20 via-transparent to-transparent"
        />
      </div>

      {/* Main Scanner Visual */}
      <div className="relative w-64 h-64 flex items-center justify-center mb-12">
        {/* Outer Ring */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-slate-700/50 border-t-blue-500 border-l-transparent"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-slate-700/50 border-b-purple-500 border-r-transparent"
        />
        
        {/* Pulsing Core */}
        <motion.div 
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.5)]"
        >
          <AnimatePresence mode="wait">
             <motion.div
               key={phase}
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0, opacity: 0 }}
               transition={{ type: "spring", stiffness: 300, damping: 20 }}
             >
               <ActiveIcon size={48} className="text-white" />
             </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Orbiting Particles */}
        <div className="absolute inset-0 animate-spin-slow">
           <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa]"></div>
        </div>
      </div>

      {/* Text Area */}
      <div className="relative z-10 text-center space-y-4 px-6 max-w-sm">
        <motion.h2 
          key={phase}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400`}
        >
          {phases[phase].text}
        </motion.h2>
        
        <p className="text-slate-400 text-sm font-mono flex justify-center items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          AI Model Processing
        </p>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-6">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((phase + 1) / phases.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};