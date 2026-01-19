
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Sparkles, Stethoscope, Pill, ArrowRight, Activity, ScanLine, ImagePlus, X, Globe, Mail, Mic, MicOff, Keyboard, Zap, Binary, Aperture } from 'lucide-react';
import { AppMode, DrugInfo, DiagnosisInfo, LoadingState, Language, SpeechRecognition } from './types';
import { t } from './translations';
// Import from Qwen Service
import { getDrugInfoFromImage, getDrugInfoFromText, analyzeSymptoms } from './services/qwenService';
import { ResultCard } from './components/ResultCard';
import { DiagnosisResultCard } from './components/DiagnosisResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Toast, ToastType } from './components/Toast';

type Tab = 'DRUG' | 'DIAGNOSIS';

// --- Artistic Background Component ---
const CyberBackground = React.memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#f8fafc]">
    {/* Noise Texture */}
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
    
    {/* Subtle Grid */}
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

    {/* Floating Orbs */}
    <motion.div 
      animate={{ x: [0, 50, -50, 0], y: [0, -30, 30, 0], scale: [1, 1.1, 0.9, 1] }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-[120px]"
    />
    <motion.div 
      animate={{ x: [0, -40, 40, 0], y: [0, 60, -60, 0], opacity: [0.4, 0.6, 0.4] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/40 to-purple-200/40 rounded-full blur-[100px]"
    />
  </div>
));

function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [activeTab, setActiveTab] = useState<Tab>('DRUG');
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  
  // Data States
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [diagnosisInfo, setDiagnosisInfo] = useState<DiagnosisInfo | null>(null);
  
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  // Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [symptomsQuery, setSymptomsQuery] = useState('');
  const [diagnosisImage, setDiagnosisImage] = useState<string | null>(null);

  // Voice State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Refs
  const drugFileInputRef = useRef<HTMLInputElement>(null);
  const diagnosisFileInputRef = useRef<HTMLInputElement>(null);

  const T = t[lang];

  // --- Handlers ---

  const showToast = (message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  };

  const closeToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
    showToast(lang === 'zh' ? 'Switched to English' : '已切换至中文', 'success');
  };

  // Voice Recognition Logic
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        showToast(T.voice_error, 'error');
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
        recognition.continuous = false; 
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const lastResultIndex = event.results.length - 1;
          const transcript = event.results[lastResultIndex][0].transcript;
          
          if (event.results[lastResultIndex].isFinal) {
             setSymptomsQuery((prev) => {
               const needsSpace = prev.length > 0 && !prev.endsWith(' ');
               return prev + (needsSpace ? ' ' : '') + transcript;
             });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
             showToast(T.voice_error, 'error');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.error("Voice start error", e);
        showToast(T.voice_error, 'error');
      }
    }
  };

  const handleDrugSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading({ isLoading: true, message: T.loading_drug });
    try {
      const info = await getDrugInfoFromText(searchQuery, lang);
      setDrugInfo(info);
      setMode(AppMode.RESULT);
    } catch (error: any) {
      showToast(error.message || "Search failed", 'error');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const handleDrugFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading({ isLoading: true, message: T.loading_vision });
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const info = await getDrugInfoFromImage(base64String, lang);
        setDrugInfo(info);
        setMode(AppMode.RESULT);
      } catch (error: any) {
        showToast(`${T.upload_fail}: ` + (error.message || "Error"), 'error');
      } finally {
        setLoading({ isLoading: false, message: '' });
        if (drugFileInputRef.current) drugFileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDiagnosisFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
        setDiagnosisImage(reader.result as string);
        if (diagnosisFileInputRef.current) diagnosisFileInputRef.current.value = '';
        showToast(T.image_attached, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSymptomAnalysis = async () => {
    if (!symptomsQuery.trim() && !diagnosisImage) {
        showToast(T.missing_input, 'error');
        return;
    }

    setLoading({ isLoading: true, message: T.loading_diagnosis });
    try {
      const info = await analyzeSymptoms(symptomsQuery, diagnosisImage || undefined, lang);
      setDiagnosisInfo(info);
      setMode(AppMode.DIAGNOSIS_RESULT);
    } catch (error: any) {
       showToast(`${T.diagnosis_fail}: ` + (error.message || "Error"), 'error');
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  // Improved handler to prevent UI freeze
  const handleDiagnosisItemClick = async (itemQuery: string) => {
    // 1. Set loading state immediately to trigger UI update (Loading Overlay)
    setLoading({ 
        isLoading: true, 
        message: lang === 'zh' ? `正在查询 "${itemQuery}" 详情...` : `Researching "${itemQuery}"...` 
    });

    // 2. Use setTimeout to push the heavy API call to the next tick
    // Increased to 80ms to ensure the browser has time to paint the loading overlay frames
    setTimeout(async () => {
        try {
           const info = await getDrugInfoFromText(itemQuery, lang);
           setDrugInfo(info);
           setMode(AppMode.RESULT); 
        } catch (error: any) {
           showToast(lang === 'zh' ? "查询详情失败" : "Failed to fetch details", 'error');
        } finally {
           setLoading({ isLoading: false, message: '' });
        }
    }, 80);
  };

  const clearDiagnosisImage = () => setDiagnosisImage(null);

  const handleBack = useCallback(() => {
    // Smart Back Navigation
    if (mode === AppMode.RESULT && diagnosisInfo !== null) {
      setMode(AppMode.DIAGNOSIS_RESULT);
      setTimeout(() => setDrugInfo(null), 500);
    } else {
      setMode(AppMode.HOME);
      setTimeout(() => {
          setDrugInfo(null);
          setDiagnosisInfo(null);
      }, 500); 
    }
  }, [mode, diagnosisInfo]);

  // --- Render ---

  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-x-hidden flex flex-col selection:bg-indigo-500/20">
      <CyberBackground />
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={closeToast} 
      />

      <input type="file" ref={drugFileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleDrugFileUpload} />
      <input type="file" ref={diagnosisFileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleDiagnosisFileUpload} />

      {/* Header - Only visible in HOME mode to prevent overlap with Result cards */}
      <AnimatePresence>
        {mode === AppMode.HOME && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-40 p-4 md:p-6 flex justify-between items-center pointer-events-none"
          >
             <div className="pointer-events-auto flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                   <Activity size={18} />
                </div>
                <span className="font-bold text-slate-700 tracking-tight hidden sm:block">SmartMed</span>
             </div>
            <button 
              onClick={toggleLanguage}
              className="pointer-events-auto bg-white/50 backdrop-blur-md border border-white/60 shadow-sm rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white transition-all text-slate-600 font-medium text-xs md:text-sm group"
            >
              <Globe size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              <span>{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex-1 flex flex-col">
        
        {loading.isLoading && <LoadingOverlay message={loading.message} type={activeTab} lang={lang} />}

        {/* --- RESULT VIEWS --- */}
        <AnimatePresence mode="wait">
          {mode === AppMode.RESULT && drugInfo ? (
            <motion.div 
              key="drug-result"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-screen fixed inset-0 z-50 bg-[#f8fafc]"
            >
              <ResultCard info={drugInfo} onBack={handleBack} lang={lang} />
            </motion.div>
          ) : mode === AppMode.DIAGNOSIS_RESULT && diagnosisInfo ? (
             <motion.div 
              key="diagnosis-result"
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-screen fixed inset-0 z-50 bg-[#f8fafc]"
            >
              <DiagnosisResultCard 
                info={diagnosisInfo} 
                onBack={handleBack} 
                lang={lang} 
                onItemClick={handleDiagnosisItemClick}
              />
            </motion.div>
          ) : (
            
            /* --- HOME VIEW --- */
            <motion.div 
              key="home"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 md:p-8 gap-8 lg:gap-20 max-w-7xl mx-auto w-full min-h-[90vh]"
            >
              
              {/* Left Column: Branding */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 lg:flex-1 relative">
                 {/* Decor elements */}
                 <div className="absolute -top-20 -left-20 opacity-20 pointer-events-none hidden lg:block">
                    <Binary size={200} className="text-slate-400" />
                 </div>

                 <div className="relative inline-block">
                   <motion.div 
                     animate={{ 
                        boxShadow: activeTab === 'DRUG' 
                            ? "0 20px 50px -12px rgba(59, 130, 246, 0.5)" 
                            : "0 20px 50px -12px rgba(99, 102, 241, 0.5)"
                     }}
                     className={`w-28 h-28 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 relative z-10 bg-gradient-to-br ${activeTab === 'DRUG' ? 'from-blue-500 to-cyan-400' : 'from-indigo-500 to-purple-500'}`}
                   >
                     <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            exit={{ scale: 0.5, opacity: 0, rotate: 45 }}
                            transition={{ type: "spring", stiffness: 200 }}
                        >
                             {activeTab === 'DRUG' ? <Pill size={56} className="text-white" /> : <Stethoscope size={56} className="text-white" />}
                        </motion.div>
                     </AnimatePresence>
                   </motion.div>
                </div>

                <div className="space-y-6 max-w-xl">
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 leading-[1.1]">
                    {T.title.split(' ')[0]}<span className={`bg-clip-text text-transparent bg-gradient-to-r ${activeTab === 'DRUG' ? 'from-blue-600 to-cyan-500' : 'from-indigo-600 to-purple-500'}`}>Med</span>
                  </h1>
                  <h2 className="text-2xl md:text-3xl font-light text-slate-600 whitespace-pre-line tracking-tight">
                    {T.hero_title}
                  </h2>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                     <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-500 flex items-center gap-1">
                        <Aperture size={12} /> Computer Vision
                     </span>
                     <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-mono text-slate-500 flex items-center gap-1">
                        <Zap size={12} /> LLM Reasoning
                     </span>
                  </div>
                  <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                    {T.hero_desc}
                  </p>
                </div>
              </div>

              {/* Right Column: Interaction Hub */}
              <div className="w-full max-w-md lg:max-w-[540px] lg:flex-1 perspective-1000">
                 
                 {/* Glass Panel */}
                 <div className="relative bg-white/60 backdrop-blur-2xl border border-white/50 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] rounded-[3rem] p-3 md:p-5 overflow-hidden group">
                    
                    {/* Inner sheen effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none"></div>

                    {/* Navigation Pills */}
                    <div className="flex bg-slate-100/50 p-1.5 rounded-[2rem] mb-6 relative z-10 backdrop-blur-sm">
                      <button 
                        onClick={() => setActiveTab('DRUG')}
                        className={`flex-1 py-3.5 rounded-[1.7rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'DRUG' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <ScanLine size={18} /> {T.tab_drug}
                      </button>
                      <button 
                        onClick={() => setActiveTab('DIAGNOSIS')}
                        className={`flex-1 py-3.5 rounded-[1.7rem] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === 'DIAGNOSIS' ? 'bg-white text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Activity size={18} /> {T.tab_diagnosis}
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white/50 rounded-[2.5rem] p-6 min-h-[440px] flex flex-col relative border border-white/60">
                      <AnimatePresence mode="wait">
                        {activeTab === 'DRUG' ? (
                          /* DRUG SEARCH UI */
                          <motion.div
                            key="drug-panel"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col h-full gap-5"
                          >
                             {/* Scan Button - Large Hero Action */}
                             <button
                                onClick={() => drugFileInputRef.current?.click()}
                                className="relative flex-1 group overflow-hidden rounded-[2rem] bg-slate-900 shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                             >
                                {/* Animated Gradient Bg */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                                
                                <div className="relative z-10 h-full flex flex-col items-center justify-center gap-4 p-8">
                                   <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                      <Camera size={36} className="text-white drop-shadow-md" />
                                   </div>
                                   <div className="text-center">
                                      <h3 className="text-2xl font-bold text-white mb-1">{T.scan_btn}</h3>
                                      <p className="text-blue-100/80 text-sm font-medium">{T.scan_desc}</p>
                                   </div>
                                </div>
                             </button>

                             {/* Manual Search Input */}
                             <div className="flex flex-col gap-3">
                                <span className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{T.or_manual}</span>
                                <form onSubmit={handleDrugSearch} className="relative group">
                                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                  <div className="relative flex items-center bg-white rounded-2xl shadow-sm border border-slate-200 focus-within:border-blue-400 transition-colors p-1">
                                      <div className="pl-4 text-slate-400">
                                         <Search size={20} />
                                      </div>
                                      <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={T.search_placeholder}
                                        className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-slate-700 placeholder:text-slate-400 font-medium"
                                      />
                                      <button 
                                        type="submit"
                                        disabled={!searchQuery.trim()}
                                        className="bg-slate-900 text-white p-3 rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900"
                                      >
                                         <ArrowRight size={18} />
                                      </button>
                                  </div>
                                </form>
                             </div>
                          </motion.div>
                        ) : (
                          /* DIAGNOSIS UI */
                          <motion.div
                            key="diagnosis-panel"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col h-full gap-5"
                          >
                             {/* Header */}
                             <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                   <h3 className="text-xl font-bold text-slate-800">{T.symptom_title}</h3>
                                   <p className="text-xs text-slate-400 font-medium">AI-Powered Analysis</p>
                                </div>
                                <div className="flex gap-1">
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-300"></div>
                                </div>
                             </div>

                             {/* Main Input Area - Glass Card */}
                             <div className={`relative flex-1 bg-white rounded-[1.5rem] border transition-all duration-300 flex flex-col overflow-hidden shadow-sm ${isListening ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                                
                                {/* Text Input */}
                                <textarea
                                  value={symptomsQuery}
                                  onChange={(e) => setSymptomsQuery(e.target.value)}
                                  placeholder={isListening ? "" : T.symptom_placeholder}
                                  className="flex-1 w-full bg-transparent p-5 resize-none outline-none text-slate-700 placeholder:text-slate-300 text-base leading-relaxed"
                                />

                                {/* Voice Visualizer Overlay */}
                                <AnimatePresence>
                                  {isListening && (
                                    <motion.div 
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20"
                                    >
                                       <div className="flex items-center gap-1.5 h-12">
                                          {[1,2,3,4,5].map(i => (
                                             <motion.div
                                                key={i}
                                                animate={{ height: [10, 30, 10] }}
                                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                                                className="w-1.5 bg-red-500 rounded-full"
                                             />
                                          ))}
                                       </div>
                                       <p className="text-red-500 font-bold tracking-widest text-sm uppercase">{T.voice_listening}</p>
                                    </motion.div>
                                  )}
                                </AnimatePresence>

                                {/* Toolbar Bottom */}
                                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      {/* Voice Toggle */}
                                      <button
                                        onClick={toggleListening}
                                        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                                            isListening 
                                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' 
                                            : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                                        }`}
                                      >
                                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                      </button>
                                      
                                      {/* Image Upload Trigger */}
                                      <button
                                        onClick={() => diagnosisFileInputRef.current?.click()}
                                        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                                            diagnosisImage
                                            ? 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200'
                                        }`}
                                        title={T.input_image_label}
                                      >
                                         <ImagePlus size={18} />
                                      </button>
                                   </div>
                                   
                                   <div className="text-xs text-slate-400 font-medium">
                                      {symptomsQuery.length > 0 ? `${symptomsQuery.length} chars` : 'Ready'}
                                   </div>
                                </div>
                             </div>

                             {/* Image Preview (If Exists) */}
                             <AnimatePresence>
                                {diagnosisImage && (
                                   <motion.div 
                                     initial={{ opacity: 0, height: 0 }}
                                     animate={{ opacity: 1, height: 'auto' }}
                                     exit={{ opacity: 0, height: 0 }}
                                     className="relative overflow-hidden"
                                   >
                                      <div className="bg-white p-2 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-3">
                                         <img src={diagnosisImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                         <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{T.image_attached}</p>
                                            <p className="text-xs text-indigo-500">Analysis Pending</p>
                                         </div>
                                         <button onClick={clearDiagnosisImage} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                                            <X size={16} />
                                         </button>
                                      </div>
                                   </motion.div>
                                )}
                             </AnimatePresence>

                             {/* Action Button */}
                             <button 
                                onClick={handleSymptomAnalysis}
                                disabled={!symptomsQuery.trim() && !diagnosisImage}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                              >
                                <span>{T.start_diagnosis}</span>
                                <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                              </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                 </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Contact - Fixed Bottom Right */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs text-slate-500 hover:scale-105 transition-transform hover:bg-white hover:text-blue-600 cursor-pointer group">
          <Mail size={14} className="group-hover:animate-bounce" />
          <span>{T.contact}: zzy2630816871@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

export default App;
