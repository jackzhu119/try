import React, { useState } from 'react';
import { DrugInfo } from '../types';
import { generateDrugAudio } from '../services/geminiService';
import { playAudio } from '../services/audioUtils';

interface ResultCardProps {
  info: DrugInfo;
  onBack: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ info, onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [stopAudio, setStopAudio] = useState<(() => void) | null>(null);

  const handlePlayAudio = async () => {
    if (isPlaying && stopAudio) {
      stopAudio();
      setIsPlaying(false);
      setStopAudio(null);
      return;
    }

    try {
      setIsGeneratingAudio(true);
      // Generate TTS using the summary field
      const audioBase64 = await generateDrugAudio(info.summary);
      
      setIsGeneratingAudio(false);
      setIsPlaying(true);
      
      const stopFn = await playAudio(audioBase64);
      setStopAudio(() => () => {
        stopFn();
        setIsPlaying(false);
        setStopAudio(null);
      });
    } catch (err) {
      console.error(err);
      setIsGeneratingAudio(false);
      alert("无法播放语音，请稍后再试。");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-[85vh]">
      {/* Header Image/Banner */}
      <div className="h-32 bg-gradient-to-r from-teal-400 to-blue-500 relative flex-shrink-0">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute -bottom-10 left-6 w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center text-3xl">
          💊
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 px-6 pb-6 flex-1 overflow-y-auto no-scrollbar">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">{info.name}</h1>
        <p className="text-sm text-slate-500 mb-6">智能识别结果</p>

        {/* Audio Player Button */}
        <button
          onClick={handlePlayAudio}
          disabled={isGeneratingAudio}
          className={`w-full mb-6 py-4 rounded-xl flex items-center justify-center space-x-3 transition-all transform active:scale-95 shadow-lg ${
            isPlaying 
              ? 'bg-red-50 text-red-600 border border-red-200' 
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          }`}
        >
           {isGeneratingAudio ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
           ) : isPlaying ? (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span className="font-semibold">停止播报</span>
            </>
           ) : (
            <>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <span className="font-semibold">语音播报说明书</span>
            </>
           )}
        </button>

        {/* Info Grid */}
        <div className="space-y-4">
          <InfoItem title="📋 适应症 (Indications)" content={info.indications} />
          <InfoItem title="💊 用法用量 (Dosage)" content={info.dosage} />
          <InfoItem title="🚫 禁忌 (Contraindications)" content={info.contraindications} isWarning />
          <InfoItem title="⚠️ 不良反应 (Side Effects)" content={info.sideEffects} />
          <InfoItem title="📦 贮藏 (Storage)" content={info.storage} />
        </div>
      </div>
    </div>
  );
};

const InfoItem: React.FC<{ title: string; content: string; isWarning?: boolean }> = ({ title, content, isWarning }) => (
  <div className={`p-4 rounded-2xl ${isWarning ? 'bg-red-50 border border-red-100' : 'bg-slate-50 border border-slate-100'}`}>
    <h3 className={`text-sm font-bold mb-2 ${isWarning ? 'text-red-700' : 'text-slate-700'}`}>{title}</h3>
    <p className={`text-sm leading-relaxed ${isWarning ? 'text-red-600' : 'text-slate-600'}`}>
      {content || "暂无详细信息"}
    </p>
  </div>
);