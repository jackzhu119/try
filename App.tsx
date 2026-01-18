import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Sparkles, Stethoscope, Pill, ArrowRight, Activity, ScanLine, ImagePlus, X, Globe, Mail } from 'lucide-react';
import { AppMode, DrugInfo, DiagnosisInfo, LoadingState, Language } from './types';
import { t } from './translations';
import { getDrugInfoFromImage, getDrugInfoFromText, analyzeSymptoms } from './services/qwenService';
import { ResultCard } from './components/ResultCard';
import { DiagnosisResultCard } from './components/DiagnosisResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';

type Tab = 'DRUG' | 'DIAGNOSIS';

// Optimization: Moved outside App to prevent re-renders on state changes
const AmbientBackground = React.memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50">
     {/* Mesh Gradient Overlay */}
     <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]"></div>
     
    <motion.div 
      animate={{ 
        x: [0, 100, -50, 0], 
        y: [0, -50, 50, 0],
        scale: [1, 1.2, 0.9, 1] 
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-blue-200/40 rounded-full blur-[100px]"
    />
    <motion.div 
      animate={{ 
        x: [0, -70, 30, 0], 
        y: [0, 80, -30, 0],
        scale: [1, 1.1, 1] 
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute top-[30%] -right-40 w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px]"
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
  
  // Inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [symptomsQuery, setSymptomsQuery] = useState('');
  const [diagnosisImage, setDiagnosisImage] = useState<string | null>(null);
  
  // Refs
  const drugFileInputRef = useRef<HTMLInputElement>(null);
  const diagnosisFileInputRef = useRef<HTMLInputElement>(null);

  const T = t[lang];

  // --- Handlers ---

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
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
      alert(error.message || "Search failed");
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
        alert(`${T.upload_fail}: ` + (error.message || "Error"));
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
    };
    reader.readAsDataURL(file);
  };

  const handleSymptomAnalysis = async () => {
    if (!symptomsQuery.trim() && !diagnosisImage) {
        alert(T.missing_input);
        return;
    }

    setLoading({ isLoading: true, message: T.loading_diagnosis });
    try {
      const info = await analyzeSymptoms(symptomsQuery, diagnosisImage || undefined, lang);
      setDiagnosisInfo(info);
      setMode(AppMode.DIAGNOSIS_RESULT);
    } catch (error: any) {
       alert(`${T.diagnosis_fail}: ` + (error.message || "Error"));
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const clearDiagnosisImage = () => setDiagnosisImage(null);

  const handleBack = useCallback(() => {
    setMode(AppMode.HOME);
    // Performance Optimization: 
    // Delay clearing data to ensure the exit animation (AnimatePresence) has the data it needs to render.
    // This also reduces the amount of state updates happening in a single frame.
    setTimeout(() => {
        setDrugInfo(null);
        setDiagnosisInfo(null);
    }, 500); 
  }, []);

  // --- Render ---

  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-x-hidden flex flex-col">
      <AmbientBackground />

      <input type="file" ref={drugFileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleDrugFileUpload} />
      <input type="file" ref={diagnosisFileInputRef} accept="image/*" capture="environment" className="hidden" onChange={handleDiagnosisFileUpload} />

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 p-6 flex justify-end pointer-events-none">
        <button 
          onClick={toggleLanguage}
          className="pointer-events-auto bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm rounded-full px-4 py-2 flex items-center gap-2 hover:bg-white transition-all text-slate-700 font-medium text-sm"
        >
          <Globe size={16} />
          <span>{lang === 'zh' ? '中文 / English' : 'English / 中文'}</span>
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        
        {loading.isLoading && <LoadingOverlay message={loading.message} type={activeTab} lang={lang} />}

        {/* --- RESULT VIEWS --- */}
        <AnimatePresence mode="wait">
          {mode === AppMode.RESULT && drugInfo ? (
            <motion.div 
              key="drug-result"
              initial={{ opacity: 0, scale: 0.98, x: 20 }} 
              animate={{ opacity: 1, scale: 1, x: 0 }} 
              exit={{ opacity: 0, scale: 0.98, x: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full h-screen fixed inset-0 z-20 bg-slate-50"
            >
              <ResultCard info={drugInfo} onBack={handleBack} lang={lang} />
            </motion.div>
          ) : mode === AppMode.DIAGNOSIS_RESULT && diagnosisInfo ? (
             <motion.div 
              key="diagnosis-result"
              initial={{ opacity: 0, scale: 0.98, x: 20 }} 
              animate={{ opacity: 1, scale: 1, x: 0 }} 
              exit={{ opacity: 0, scale: 0.98, x: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full h-screen fixed inset-0 z-20 bg-slate-50"
            >
              <DiagnosisResultCard info={diagnosisInfo} onBack={handleBack} lang={lang} />
            </motion.div>
          ) : (
            
            /* --- HOME VIEW (Split Layout on Desktop) --- */
            <motion.div 
              key="home"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex flex-col lg:flex-row items-center justify-center p-6 gap-12 lg:gap-24 max-w-7xl mx-auto w-full min-h-[90vh]"
            >
              
              {/* Left Column: Branding (Desktop) / Top (Mobile) */}
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:flex-1">
                 <div className="relative inline-block mb-4 lg:mb-0">
                   <motion.div 
                     animate={{ rotate: [0, 5, -5, 0] }}
                     transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                     className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-2xl transition-colors duration-500 ${activeTab === 'DRUG' ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-blue-500/30' : 'bg-gradient-to-tr from-indigo-500 to-purple-400 shadow-purple-500/30'}`}
                   >
                     {activeTab === 'DRUG' ? <Pill size={48} className="text-white" /> : <Stethoscope size={48} className="text-white" />}
                   </motion.div>
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ delay: 0.5 }}
                     className="absolute -top-3 -right-3 bg-white text-blue-600 p-2 rounded-full shadow-lg"
                   >
                     <Sparkles size={20} fill="currentColor" />
                   </motion.div>
                </div>

                <div className="space-y-4 max-w-lg">
                  <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
                    {T.title.split(' ')[0]}<span className={`transition-colors duration-500 ${activeTab === 'DRUG' ? 'text-blue-600' : 'text-indigo-600'}`}>Med</span>
                  </h1>
                  <h2 className="text-2xl lg:text-3xl font-medium text-slate-600 whitespace-pre-line">
                    {T.hero_title}
                  </h2>
                  <p className="text-slate-500 text-lg leading-relaxed">
                    {T.hero_desc}
                  </p>
                </div>

                <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-slate-200 text-sm font-medium text-slate-500 shadow-sm mt-8">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${activeTab === 'DRUG' ? 'bg-blue-500' : 'bg-indigo-500'}`}></div>
                   {T.powered_by} {activeTab === 'DRUG' ? 'VL Max' : 'Plus'}
                 </div>
              </div>

              {/* Right Column: Interaction Card */}
              <div className="w-full max-w-md lg:max-w-xl lg:flex-1">
                 
                 {/* Card Container */}
                 <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-2 lg:p-4 transition-all">
                    
                    {/* Tab Switcher */}
                    <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-3xl flex relative mb-6 shadow-inner border border-black/5">
                      <motion.div 
                        className="absolute top-1.5 bottom-1.5 rounded-[1.2rem] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] z-0"
                        initial={false}
                        animate={{ 
                          left: activeTab === 'DRUG' ? '6px' : '50%', 
                          right: activeTab === 'DRUG' ? '50%' : '6px' 
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      />
                      <button 
                        onClick={() => setActiveTab('DRUG')}
                        className={`flex-1 relative z-10 py-4 text-sm lg:text-base font-bold rounded-2xl transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'DRUG' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <ScanLine size={20} />
                        <span>{T.tab_drug}</span>
                      </button>
                      <button 
                        onClick={() => setActiveTab('DIAGNOSIS')}
                        className={`flex-1 relative z-10 py-4 text-sm lg:text-base font-bold rounded-2xl transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'DIAGNOSIS' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        <Activity size={20} />
                        <span>{T.tab_diagnosis}</span>
                      </button>
                    </div>

                    {/* Interaction Content */}
                    <div className="bg-white/80 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-white/80 min-h-[360px] flex flex-col justify-center">
                      <AnimatePresence mode="wait">
                        {activeTab === 'DRUG' ? (
                          <motion.div
                            key="drug-panel"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                          >
                            <button
                              onClick={() => drugFileInputRef.current?.click()}
                              className="w-full group relative overflow-hidden bg-slate-900 text-white p-6 lg:p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
                              <div className="relative z-10 flex flex-col items-center gap-3">
                                <div className="p-4 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                                  <Camera size={32} />
                                </div>
                                <div className="text-center">
                                  <span className="text-xl font-bold block mb-1">{T.scan_btn}</span>
                                  <span className="text-slate-400 text-sm font-light group-hover:text-blue-100">{T.scan_desc}</span>
                                </div>
                              </div>
                            </button>

                            <div className="relative text-center">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200/60"></div>
                              </div>
                              <span className="relative px-3 text-sm text-slate-400 bg-white/80 rounded-full">{T.or_manual}</span>
                            </div>

                            <form onSubmit={handleDrugSearch} className="relative group">
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={T.search_placeholder}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg rounded-2xl pl-12 pr-24 py-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                              />
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search size={20} />
                              </div>
                              <button 
                                type="submit"
                                disabled={!searchQuery.trim()}
                                className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-5 rounded-xl font-medium shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 transition-all"
                              >
                                {T.search_btn}
                              </button>
                            </form>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="diagnosis-panel"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-2 text-indigo-900 font-semibold mb-2">
                                <Sparkles size={18} className="text-indigo-500" />
                                <span>{T.symptom_title}</span>
                            </div>
                            
                            <div className="relative group">
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-focus-within:opacity-75 transition duration-500"></div>
                              
                              <div className="relative bg-white rounded-xl overflow-hidden shadow-sm">
                                  <textarea
                                    value={symptomsQuery}
                                    onChange={(e) => setSymptomsQuery(e.target.value)}
                                    placeholder={T.symptom_placeholder}
                                    rows={diagnosisImage ? 3 : 5}
                                    className="w-full bg-transparent text-slate-800 text-lg p-4 focus:outline-none resize-none placeholder:text-slate-400"
                                  />

                                  {diagnosisImage && (
                                      <div className="px-4 pb-4">
                                          <div className="relative inline-block group/img">
                                              <img 
                                                src={diagnosisImage} 
                                                alt="Symptom preview" 
                                                className="h-20 w-20 object-cover rounded-lg border border-indigo-100 shadow-sm"
                                              />
                                              <button 
                                                onClick={clearDiagnosisImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                              >
                                                  <X size={12} />
                                              </button>
                                          </div>
                                      </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center px-2 pb-2 bg-slate-50/50 border-t border-slate-100 pt-2">
                                      <button
                                        onClick={() => diagnosisFileInputRef.current?.click()}
                                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                      >
                                          <ImagePlus size={20} />
                                          <span>{T.add_image}</span>
                                      </button>
                                      <span className="text-xs text-slate-400 px-2 hidden sm:inline-block">
                                          {diagnosisImage ? T.image_attached : T.camera_hint}
                                      </span>
                                  </div>
                              </div>
                            </div>

                            <button 
                              onClick={handleSymptomAnalysis}
                              disabled={!symptomsQuery.trim() && !diagnosisImage}
                              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                              <span>{T.start_diagnosis}</span>
                              <ArrowRight size={20} />
                            </button>
                            
                            <p className="text-center text-xs text-slate-400 mt-2">
                               {T.disclaimer_hint}
                            </p>
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
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-xs text-slate-500 hover:scale-105 transition-transform hover:bg-white hover:text-blue-600 cursor-pointer group">
          <Mail size={14} className="group-hover:animate-bounce" />
          <span>{T.contact}: zzy2630816871@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

export default App;