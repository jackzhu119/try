import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Camera, UploadCloud, Sparkles } from 'lucide-react';
import { AppMode, DrugInfo, LoadingState } from './types';
import { getDrugInfoFromImage, getDrugInfoFromText } from './services/geminiService';
import { ResultCard } from './components/ResultCard';
import { LoadingOverlay } from './components/LoadingOverlay';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [drugInfo, setDrugInfo] = useState<DrugInfo | null>(null);
  const [loading, setLoading] = useState<LoadingState>({ isLoading: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading({ isLoading: true, message: '正在启动分析引擎...' });
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        console.error(error);
        alert("识别失败: " + (error.message || "请确保图片清晰"));
      } finally {
        setLoading({ isLoading: false, message: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  // Background Blobs Component
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
    <div className="min-h-screen text-slate-800 font-sans">
      <AmbientBackground />

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment" 
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center p-4 sm:p-6 transition-all">
        
        {loading.isLoading && <LoadingOverlay message={loading.message} />}

        {mode === AppMode.RESULT && drugInfo ? (
          <ResultCard info={drugInfo} onBack={() => setMode(AppMode.HOME)} />
        ) : (
          <div className="w-full max-w-lg flex flex-col justify-center min-h-[90vh]">
            
            {/* Header Section */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-10 space-y-4"
            >
              <div className="relative inline-block">
                 <motion.div 
                   animate={{ rotate: [0, 10, -10, 0] }}
                   transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                   className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-teal-400 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 mx-auto text-4xl"
                 >
                   💊
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
                  Smart<span className="text-blue-600">Med</span> Guide
                </h1>
                <p className="text-slate-500 mt-2 text-lg">
                  您的 AI 专属智能药师
                </p>
              </div>
            </motion.div>

            {/* Main Interaction Area */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50"
            >
              
              {/* Scan Button */}
              <button
                onClick={triggerCamera}
                className="w-full group relative overflow-hidden bg-slate-900 text-white p-8 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
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

              <div className="relative my-8 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/60"></div>
                </div>
                <span className="relative px-3 text-sm text-slate-400 bg-transparent backdrop-blur-xl">或手动查询</span>
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearch} className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入药品名称..."
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

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 flex justify-center"
            >
               <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200/50 backdrop-blur-sm border border-white/50 text-xs font-medium text-slate-500">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]"></div>
                 Powered by Gemini 3 Flash
               </div>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;