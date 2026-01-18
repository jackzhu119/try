import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  const [step, setStep] = useState(0);
  const steps = [
    "正在连接医疗神经网络...",
    "正在解析图像特征...",
    "正在检索全球药典数据库...",
    "正在生成用药安全建议...",
    "即将完成..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000); // Change text every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 animate-fadeIn">
      {/* Animated Medical HUD Circle */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 border-4 border-t-teal-400 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin duration-1000"></div>
        {/* Inner reverse rotating ring */}
        <div className="absolute inset-2 border-2 border-t-transparent border-r-purple-400 border-b-transparent border-l-purple-400 rounded-full animate-spin-reverse-slow"></div>
        {/* Pulsing Core */}
        <div className="absolute inset-0 flex items-center justify-center">
           <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-full animate-pulse shadow-[0_0_30px_rgba(56,189,248,0.6)] flex items-center justify-center">
             <span className="text-2xl">💊</span>
           </div>
        </div>
      </div>

      {/* Text Container */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-lg">
          {message}
        </h2>
        <div className="h-6 overflow-hidden relative">
           <p className="text-teal-300 font-mono text-sm animate-pulse">
             {">"} {steps[step]}
           </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-64 h-1.5 bg-slate-700 rounded-full mt-8 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 animate-progress"></div>
      </div>
    </div>
  );
};