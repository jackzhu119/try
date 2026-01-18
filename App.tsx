import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Camera, Sparkles, Stethoscope, Pill, ArrowRight, Activity, ScanLine, ImagePlus, X } from 'lucide-react';
import { AppMode, DrugInfo, DiagnosisInfo, LoadingState } from './types';
import { getDrugInfoFromImage, getDrugInfoFromText, analyzeSymptoms } from './services/qwenService';
import { ResultCard } from './components/ResultCard';
import { DiagnosisResultCard } from './components/DiagnosisResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';

// Tab Types
type Tab = 'DRUG' | 'DIAGNOSIS';

function App() {
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
  
  // Refs for file inputs
  const drugFileInputRef = useRef<HTMLInputElement>(null);
  const diagnosisFileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleDrugSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading({ isLoading: true, message: '正在启动药品分析引擎...' });
    try {
      const info = await getDrugInfoFromText(searchQuery);
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

    setLoading({ isLoading: true, message: '视觉神经网络启动中...' });
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const info = await getDrugInfoFromImage(base64String);
        setDrugInfo(info);
        setMode(AppMode.RESULT);
      } catch (error: any) {
        alert("识别失败: " + (error.message || "请确保图片清晰"));
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

    // Just read and store the image preview, don't submit yet
    const reader = new FileReader();
    reader.onloadend = async () => {
        setDiagnosisImage(reader.result as string);
        if (diagnosisFileInputRef.current) diagnosisFileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleSymptomAnalysis = async () => {
    if (!symptomsQuery.trim() && !diagnosisImage) {
        alert("请描述症状或上传图片");
        return;
    }

    setLoading({ isLoading: true, message: 'AI 医生正在分析病情...' });
    try {
      // Pass both text and optional image
      const info = await analyzeSymptoms(symptomsQuery, diagnosisImage || undefined);
      setDiagnosisInfo(info);
      setMode(AppMode.DIAGNOSIS_RESULT);
    } catch (error: any) {
       alert("诊断失败: " + (error.message || "请稍后再试"));
    } finally {
      setLoading({ isLoading: false, message: '' });
    }
  };

  const clearDiagnosisImage = () => {
      setDiagnosisImage(null);
  }

  const handleBack = () => {
    setMode(AppMode.HOME);
    setDrugInfo(null);
    setDiagnosisInfo(null);
    // Optional: Clear inputs on back? Let's keep them for now for UX
  };

  // --- Components ---

  const AmbientBackground = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50">
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
      <motion.div 
        animate={{ 
          x: [0, 50, -50, 0], 
          y: [0, 50, 50, 0] 
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute bottom-[-100px] left-[20%] w-[600px] h-[400px] bg-teal-200/30 rounded-full blur-[100px]"
      />
    </div>
  );

  return (
    <div className="min-h-screen text-slate-800 font-sans relative overflow-x-hidden">
      <AmbientBackground />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={drugFileInputRef}
        accept="image/*"
        capture="environment" 
        className="hidden"
        onChange={handleDrugFileUpload}
      />
       <input
        type="file"
        ref={diagnosisFileInputRef}
        accept="image/*"
        capture="environment" 
        className="hidden"
        onChange={handleDiagnosisFileUpload}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center transition-all">
        
        {loading.isLoading && <LoadingOverlay message={loading.message} type={activeTab} />}

        {/* --- RESULT VIEW --- */}
        <AnimatePresence mode="wait">
          {mode === AppMode.RESULT && drugInfo ? (
            <motion.div 
              key="drug-result"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className="w-full h-screen"
            >
              <ResultCard info={drugInfo} onBack={handleBack} />
            </motion.div>
          ) : mode === AppMode.DIAGNOSIS_RESULT && diagnosisInfo ? (
             <motion.div 
              key="diagnosis-result"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
              className="w-full h-screen"
            >
              <DiagnosisResultCard info={diagnosisInfo} onBack={handleBack} />
            </motion.div>
          ) : (
            
            /* --- HOME VIEW --- */
            <motion.div 
              key="home"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full max-w-lg flex flex-col min-h-screen p-6"
            >
              {/* Header */}
              <div className="text-center mt-10 mb-8 space-y-4">
                <div className="relative inline-block">
                   <motion.div 
                     animate={{ rotate: [0, 5, -5, 0] }}
                     transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                     className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-colors duration-500 ${activeTab === 'DRUG' ? 'bg-gradient-to-tr from-blue-500 to-cyan-400 shadow-blue-500/30' : 'bg-gradient-to-tr from-indigo-500 to-purple-400 shadow-purple-500/30'}`}
                   >
                     {activeTab === 'DRUG' ? <Pill size={40} className="text-white" /> : <Stethoscope size={40} className="text-white" />}
                   </motion.div>
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ delay: 0.5 }}
                     className="absolute -top-2 -right-2 bg-white text-blue-600 p-1.5 rounded-full shadow-md"
                   >
                     <Sparkles size={16} fill="currentColor" />
                   </motion.div>
                </div>
                
                <div>
                  <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                    Smart<span className={`transition-colors duration-500 ${activeTab === 'DRUG' ? 'text-blue-600' : 'text-indigo-600'}`}>Med</span> Guide
                  </h1>
                  <p className="text-slate-500 mt-2 text-lg">
                    您的 AI 全能家庭医生
                  </p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl flex relative mb-8 shadow-sm border border-white/60">
                <motion.div 
                  className="absolute top-1.5 bottom-1.5 rounded-xl bg-white shadow-md z-0"
                  initial={false}
                  animate={{ 
                    left: activeTab === 'DRUG' ? '6px' : '50%', 
                    right: activeTab === 'DRUG' ? '50%' : '6px' 
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
                <button 
                  onClick={() => setActiveTab('DRUG')}
                  className={`flex-1 relative z-10 py-3 text-sm font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'DRUG' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ScanLine size={18} />
                  <span>查药品</span>
                </button>
                <button 
                  onClick={() => setActiveTab('DIAGNOSIS')}
                  className={`flex-1 relative z-10 py-3 text-sm font-bold rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 ${activeTab === 'DIAGNOSIS' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Activity size={18} />
                  <span>问诊状</span>
                </button>
              </div>

              {/* Main Interaction Area */}
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  
                  {/* --- MODE 1: DRUG SEARCH --- */}
                  {activeTab === 'DRUG' ? (
                    <motion.div
                      key="drug-panel"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 space-y-6"
                    >
                       {/* Scan Button */}
                      <button
                        onClick={() => drugFileInputRef.current?.click()}
                        className="w-full group relative overflow-hidden bg-slate-900 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
                        <div className="relative z-10 flex flex-col items-center gap-3">
                          <div className="p-4 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                            <Camera size={32} />
                          </div>
                          <div className="text-center">
                            <span className="text-xl font-bold block mb-1">拍照识别</span>
                            <span className="text-slate-400 text-sm font-light group-hover:text-blue-100">AI 视觉分析包装或胶囊</span>
                          </div>
                        </div>
                      </button>

                      <div className="relative text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200/60"></div>
                        </div>
                        <span className="relative px-3 text-sm text-slate-400 bg-transparent backdrop-blur-xl">或手动查询</span>
                      </div>

                      {/* Search Box */}
                      <form onSubmit={handleDrugSearch} className="relative group">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="输入药品名称 (如: 阿莫西林)..."
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg rounded-2xl pl-12 pr-24 py-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                          <Search size={20} />
                        </div>
                        <button 
                          type="submit"
                          disabled={!searchQuery.trim()}
                          className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-5 rounded-xl font-medium shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          查询
                        </button>
                      </form>
                    </motion.div>
                  ) : (
                    
                    /* --- MODE 2: SYMPTOM DIAGNOSIS --- */
                    <motion.div
                      key="diagnosis-panel"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50"
                    >
                      <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center px-1">
                           <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                              <Sparkles size={18} className="text-indigo-500" />
                              <span>描述症状 / 上传图片</span>
                           </div>
                        </div>
                        
                        <div className="relative group">
                          {/* Breathing Glow Effect */}
                          <motion.div 
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-focus-within:opacity-75 transition duration-500"
                          ></motion.div>
                          
                          <div className="relative bg-white rounded-xl overflow-hidden">
                              <textarea
                                value={symptomsQuery}
                                onChange={(e) => setSymptomsQuery(e.target.value)}
                                placeholder="请描述您的不适（如发烧、皮疹等）..."
                                rows={diagnosisImage ? 4 : 6}
                                className="w-full bg-transparent text-slate-800 text-lg p-4 focus:outline-none resize-none placeholder:text-slate-400"
                              />

                              {/* Image Preview Area */}
                              {diagnosisImage && (
                                  <div className="px-4 pb-4">
                                      <div className="relative inline-block">
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
                              
                              {/* Action Bar inside text area */}
                              <div className="flex justify-between items-center px-2 pb-2 bg-slate-50/50 border-t border-slate-100 pt-2">
                                  <button
                                    onClick={() => diagnosisFileInputRef.current?.click()}
                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                  >
                                      <ImagePlus size={20} />
                                      <span>添加图片</span>
                                  </button>
                                  <span className="text-xs text-slate-400 px-2">
                                      {diagnosisImage ? '已附加图片' : '可拍摄患处'}
                                  </span>
                              </div>
                          </div>
                        </div>

                        <button 
                          onClick={handleSymptomAnalysis}
                          disabled={!symptomsQuery.trim() && !diagnosisImage}
                          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                          <span>开始 AI 诊断</span>
                          <ArrowRight size={20} />
                        </button>
                        
                        <p className="text-center text-xs text-slate-400 mt-2">
                           * AI 建议仅供参考，急重症请立即就医
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <motion.div 
                className="mt-8 flex justify-center pb-6"
              >
                 <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200/50 backdrop-blur-sm border border-white/50 text-xs font-medium text-slate-500">
                   <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_5px_currentColor] ${activeTab === 'DRUG' ? 'bg-blue-500 shadow-blue-500' : 'bg-indigo-500 shadow-indigo-500'}`}></div>
                   Powered by Qwen {activeTab === 'DRUG' ? 'VL Max' : 'Plus'}
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;