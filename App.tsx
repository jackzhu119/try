import React, { useState, useRef } from 'react';
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

    setLoading({ isLoading: true, message: 'AI 药师正在分析...' });
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

    setLoading({ isLoading: true, message: '正在进行视觉识别...' });
    
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

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 relative overflow-hidden font-sans selection:bg-teal-200">
      
      {/* 1. Artistic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-teal-200/40 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[60%] h-[40%] bg-blue-200/40 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment" 
        className="hidden"
        onChange={handleFileUpload}
      />

      {loading.isLoading && <LoadingOverlay message={loading.message} />}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        
        {mode === AppMode.RESULT && drugInfo ? (
          <ResultCard info={drugInfo} onBack={() => setMode(AppMode.HOME)} />
        ) : (
          <div className="w-full max-w-lg">
            
            {/* Header / Logo Area */}
            <div className="text-center mb-12 animate-fadeInDown">
              <div className="inline-block relative">
                 <div className="absolute inset-0 bg-teal-400 blur-xl opacity-30 rounded-full"></div>
                 <div className="relative w-24 h-24 bg-gradient-to-br from-white to-slate-100 rounded-3xl shadow-xl flex items-center justify-center border border-white/50 mx-auto mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <span className="text-5xl drop-shadow-sm">🩺</span>
                 </div>
              </div>
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
                智能<span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">药师</span>
              </h1>
              <p className="text-slate-500 text-lg">您的 24 小时 AI 专属用药顾问</p>
            </div>

            {/* Main Action Card */}
            <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 p-8 animate-fadeInUp">
              
              {/* Scan Button */}
              <button
                onClick={triggerCamera}
                className="w-full group relative overflow-hidden bg-slate-900 text-white p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center justify-center space-y-2">
                  <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xl font-bold tracking-wide">拍照识别药品</span>
                  <span className="text-xs text-slate-300 font-light group-hover:text-white/90">支持包装盒、药瓶、胶囊板</span>
                </div>
              </button>

              <div className="flex items-center my-8">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="px-4 text-slate-400 text-sm font-medium">或</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              {/* Search Input */}
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入药品名称，如：布洛芬"
                  className="w-full bg-slate-50/80 border border-slate-200 text-slate-800 text-lg rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none focus:bg-white transition-all shadow-inner placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-white rounded-xl text-blue-600 font-bold shadow-sm hover:bg-blue-50 disabled:opacity-0 disabled:pointer-events-none transition-all"
                >
                  查询
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center space-y-2">
               <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 border border-white/50 backdrop-blur-sm shadow-sm">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-xs font-semibold text-slate-600">Qwen-VL Max 模型已连接</span>
               </div>
               <p className="text-[10px] text-slate-400">
                 AI 生成内容仅供参考，用药请务必遵医嘱
               </p>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default App;