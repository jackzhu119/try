import React, { useState, useEffect } from 'react';
import { DrugInfo } from '../types';

interface ResultCardProps {
  info: DrugInfo;
  onBack: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ info, onBack }) => {
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

  return (
    <div className="w-full max-w-2xl mx-auto h-[90vh] flex flex-col relative animate-slideUp">
      {/* Background Glow */}
      <div className="absolute -z-10 top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-teal-100/80 to-transparent blur-3xl pointer-events-none"></div>

      {/* Floating Header */}
      <div className="relative z-10 px-4 pt-4 pb-2">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-slate-600 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">返回查询</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="flex-1 bg-white/80 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col border border-white/50">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          
          {/* Drug Title Section */}
          <div className="text-center border-b border-slate-100 pb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4 text-3xl">
              💊
            </div>
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">{info.name}</h1>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                已验证
              </span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                AI 药师
              </span>
            </div>
          </div>

          {/* AI Summary & Audio */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-blue-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-30 -translate-y-10 translate-x-10"></div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-3">
                 <h2 className="text-blue-800 font-bold flex items-center gap-2">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                   药师速览
                 </h2>
                 <button onClick={handlePlayAudio} className="text-blue-600 hover:text-blue-800 transition-colors">
                    {isPlaying ? (
                      <div className="flex space-x-1 items-center h-5">
                         <div className="w-1 h-3 bg-blue-600 animate-bounce"></div>
                         <div className="w-1 h-5 bg-blue-600 animate-bounce animation-delay-100"></div>
                         <div className="w-1 h-3 bg-blue-600 animate-bounce animation-delay-200"></div>
                      </div>
                    ) : (
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                    )}
                 </button>
               </div>
               <p className="text-slate-700 leading-relaxed text-sm text-justify">
                 {info.summary}
               </p>
             </div>
          </div>

          {/* Warm Tips (New Section) */}
          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
             <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-3">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
               温馨提示 & 生活建议
             </h3>
             <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
               {info.usage_tips || "注意休息，多喝水，祝您早日康复。"}
             </p>
          </div>

          {/* Detailed Info Grid */}
          <div className="space-y-4 pb-8">
            <InfoItem icon="📋" title="适应症" content={info.indications} />
            <InfoItem icon="🥣" title="用法用量" content={info.dosage} />
            <InfoItem icon="🚫" title="禁忌" content={info.contraindications} isWarning />
            <InfoItem icon="⚠️" title="不良反应" content={info.sideEffects} />
            <InfoItem icon="📦" title="贮藏方式" content={info.storage} />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ icon: string; title: string; content: string; isWarning?: boolean }> = ({ icon, title, content, isWarning }) => (
  <div className={`p-5 rounded-2xl transition-all hover:shadow-md ${isWarning ? 'bg-red-50/80 border border-red-100' : 'bg-white border border-slate-100 shadow-sm'}`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <h3 className={`font-bold ${isWarning ? 'text-red-800' : 'text-slate-800'}`}>{title}</h3>
    </div>
    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isWarning ? 'text-red-700' : 'text-slate-600'}`}>
      {content || "暂无详细信息"}
    </div>
  </div>
);