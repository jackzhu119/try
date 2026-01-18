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
  
  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading({ isLoading: true, message: '正在查询药品数据库...' });
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

    setLoading({ isLoading: true, message: '正在识别药品包装...' });
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;
        const info = await getDrugInfoFromImage(base64String);
        setDrugInfo(info);
        setMode(AppMode.RESULT);
      } catch (error: any) {
        alert(error.message || "Image recognition failed");
      } finally {
        setLoading({ isLoading: false, message: '' });
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      {/* Hidden File Input for Camera/Gallery */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment" // Prefer rear camera on mobile
        className="hidden"
        onChange={handleFileUpload}
      />

      {loading.isLoading && <LoadingOverlay message={loading.message} />}

      {mode === AppMode.RESULT && drugInfo ? (
        <ResultCard info={drugInfo} onBack={() => setMode(AppMode.HOME)} />
      ) : (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden min-h-[500px] flex flex-col relative">
           {/* Decorative Background Circles */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
           <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

          <div className="p-8 z-10 flex flex-col h-full">
            <div className="text-center mb-10 mt-6">
               <div className="w-20 h-20 bg-gradient-to-tr from-teal-400 to-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
                 <span className="text-4xl">🩺</span>
               </div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">智能药师</h1>
              <p className="text-slate-500 mt-2">扫一扫，听懂您的药品说明书</p>
            </div>

            <div className="space-y-6 flex-1">
              {/* Scan Button */}
              <button
                onClick={triggerCamera}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-teal-500 to-emerald-500 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 active:scale-95"
              >
                <div className="relative z-10 flex items-center justify-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xl font-bold">扫描药品 / 包装</span>
                </div>
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">或者手动查询</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入药品名称 (如: 阿莫西林)"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-lg rounded-xl pl-5 pr-12 py-4 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-transparent transition-shadow shadow-inner"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-8">
              AI生成内容仅供参考，用药请务必遵医嘱
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;