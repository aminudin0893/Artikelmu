import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { 
  Pen, 
  AlignLeft, 
  AlignCenter,
  AlignRight,
  AlignJustify,
  ListOrdered, 
  Folders, 
  Palette, 
  Wand2, 
  Settings, 
  Copy, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Newspaper,
  X,
  Eye,
  EyeOff,
  Clipboard,
  Loader2,
  RefreshCw,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WRITING_STYLES, type WritingStyle } from './constants';
import { cn } from './lib/utils';

export default function App() {
  const [topic, setTopic] = useState('');
  const [paragraphs, setParagraphs] = useState(4);
  const [category, setCategory] = useState<WritingStyle['category']>('Jurnalistik');
  const [selectedStyleId, setSelectedStyleId] = useState('formal');
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || '';
    }
    return '';
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [status, setStatus] = useState<'empty' | 'loading' | 'success' | 'error'>('empty');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('left');

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isLoggedIn') === 'true';
    }
    return false;
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Amin0893&#') {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setLoginError('');
    } else {
      setLoginError('Email salah!');
    }
  };

  const resultRef = useRef<HTMLDivElement>(null);

  const filteredStyles = WRITING_STYLES.filter(s => s.category === category);

  useEffect(() => {
    if (!filteredStyles.find(s => s.id === selectedStyleId)) {
      setSelectedStyleId(filteredStyles[0].id);
    }
  }, [category]);

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setStatus('loading');
    setError('');
    setResult('');

    const styleConfig = WRITING_STYLES.find(s => s.id === selectedStyleId);
    if (!styleConfig) return;

    const userPrompt = `Buatkan tulisan berdasarkan informasi/fakta berikut:\n\n${topic}\n\nInstruksi Penting:\n1. Tuliskan tepat sebanyak ${paragraphs} paragraf (tidak termasuk judul utama).\n2. Berikan Judul Utama di baris paling atas menggunakan format Header Markdown (misal: # Judul Tulisan).\n3. Pastikan gaya penulisannya sangat kental dengan gaya yang diminta.\n4. Gunakan tata bahasa Indonesia yang baik, benar, dan sesuai dengan kaidah EYD (Ejaan Yang Disempurnakan) yang terbaru.\n5. Pastikan struktur paragraf jelas dan mengalir secara logis.\n6. Pisahkan setiap paragraf dengan tepat SATU baris kosong (dua kali pindah baris) agar sesuai standar EYD dan Markdown.`;
    const systemPrompt = styleConfig.prompt;

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey || process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: systemPrompt,
        },
      });

      const text = response.text;
      if (!text) throw new Error('AI tidak mengembalikan teks.');

      setResult(text);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      let userFriendlyError = 'Gagal menghasilkan teks. Coba beberapa saat lagi.';
      
      const errorMessage = err.message || '';
      
      if (errorMessage.includes('503') || errorMessage.includes('high demand')) {
        userFriendlyError = 'Server Gemini sedang sangat sibuk (High Demand). Silakan coba lagi dalam beberapa menit, atau gunakan API Key pribadi Anda di menu Pengaturan untuk prioritas lebih tinggi.';
      } else if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid')) {
        userFriendlyError = 'API Key yang Anda masukkan tidak valid. Silakan periksa kembali di menu Pengaturan.';
      } else if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
        userFriendlyError = 'Akses ditolak. Pastikan API Key Anda memiliki izin yang benar atau coba gunakan API Key pribadi di menu Pengaturan.';
      } else if (errorMessage.includes('quota')) {
        userFriendlyError = 'Kuota API telah habis. Silakan coba lagi nanti atau gunakan API Key pribadi.';
      } else if (errorMessage) {
        userFriendlyError = `Terjadi kesalahan: ${errorMessage}`;
      }
      
      setError(userFriendlyError);
      setStatus('error');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      // Clean text from &nbsp; and only remove leading horizontal spaces/tabs (not newlines)
      // Also normalize paragraph spacing to exactly 2 newlines (1 empty line)
      const finalResult = result
        .replace(/&nbsp;|\u00A0/g, ' ')
        .replace(/^[ \t]+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Primary method: navigator.clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(finalResult);
      } else {
        // Fallback method: textarea
        const textArea = document.createElement("textarea");
        textArea.value = finalResult;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePrint = () => {
    if (!result) return;
    window.print();
  };

  const pasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setApiKey(text);
    } catch (err) {
      console.error('Failed to paste', err);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 w-full max-w-md border border-white/50"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6 rotate-3">
              <Pen size={40} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">ArtikelMu</h1>
            <p className="text-slate-500 mt-2 font-medium">Selamat datang kembali!</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Email Anda</label>
              <div className="relative group">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none text-lg"
                  placeholder="Masukkan Email Anda..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showApiKey ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
              {loginError && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-500 text-sm mt-3 flex items-center gap-2 font-medium ml-1"
                >
                  <AlertCircle size={16} /> {loginError}
                </motion.p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-3 text-lg active:scale-[0.98]"
            >
              <CheckCircle size={24} />
              Masuk Sekarang
            </button>
          </form>
          
          <p className="text-center text-slate-400 text-xs mt-10 font-medium">
            &copy; 2026 ArtikelMu. All rights reserved.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <Pen size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">ArtikelMu</h1>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">AI Writing Assistant</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold text-indigo-700">AI Engine Online</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-200/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/50 rounded-bl-full -mr-12 -mt-12 z-0" />
              
              <div className="relative z-10 space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Buat Tulisan</h2>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">Masukkan fakta, pilih gaya, dan biarkan AI bekerja untuk Anda.</p>
                </div>

                {/* Topic Input */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 ml-1">
                    <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                      <AlignLeft size={14} />
                    </div>
                    Fakta atau Topik Utama
                  </label>
                  <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={6} 
                    className="w-full p-5 bg-slate-50/50 border border-slate-200 rounded-3xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-slate-800 leading-relaxed placeholder:text-slate-400" 
                    placeholder="Contoh: Terjadi lonjakan penggunaan AI di kalangan mahasiswa untuk mengerjakan tugas akhir..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Paragraph Count */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 ml-1">
                      <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                        <ListOrdered size={14} />
                      </div>
                      Paragraf
                    </label>
                    <div className="relative group">
                      <input 
                        type="number" 
                        value={paragraphs}
                        onChange={(e) => setParagraphs(parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        min={1} 
                        max={20} 
                        className="w-full p-4 pl-5 pr-14 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold text-lg"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-tighter pointer-events-none group-focus-within:text-indigo-400">Max 20</span>
                    </div>
                  </div>

                  {/* Category Select */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 ml-1">
                      <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                        <Folders size={14} />
                      </div>
                      Kategori
                    </label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-800 font-bold appearance-none cursor-pointer"
                    >
                      <option value="Jurnalistik">Jurnalistik</option>
                      <option value="Esai">Esai Akademik</option>
                      <option value="Khusus">Hiburan & Khusus</option>
                    </select>
                  </div>
                </div>

                {/* Style Selection */}
                <div className="space-y-4">
                  <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700 ml-1">
                    <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                      <Palette size={14} />
                    </div>
                    Pilih Gaya Penulisan
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-2xl border-2 text-left transition-all relative group overflow-hidden",
                          selectedStyleId === style.id 
                            ? "bg-indigo-50 border-indigo-600 shadow-md shadow-indigo-100" 
                            : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                        )}
                      >
                        <div className="relative z-10">
                          <p className={cn(
                            "text-sm font-bold transition-colors",
                            selectedStyleId === style.id ? "text-indigo-900" : "text-slate-800"
                          )}>{style.name}</p>
                          <p className="text-[11px] text-slate-500 mt-1 font-medium leading-tight">{style.desc}</p>
                        </div>
                        {selectedStyleId === style.id && (
                          <motion.div 
                            layoutId="active-style"
                            className="absolute inset-0 bg-indigo-600/5 z-0"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-4">
                  <button 
                    onClick={handleGenerate}
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-indigo-600 disabled:bg-indigo-400 text-white py-5 px-8 rounded-[1.5rem] font-black transition-all shadow-xl shadow-slate-200 hover:shadow-indigo-200 hover:-translate-y-1 active:scale-[0.98] text-lg"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="animate-spin" size={24} />
                    ) : (
                      <Wand2 size={24} />
                    )}
                    <span>{status === 'loading' ? 'Menyusun Kalimat...' : 'Buat Tulisan Sekarang'}</span>
                  </button>
                </div>

                {/* Settings Trigger */}
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <Settings size={14} />
                    Pengaturan API (Opsional)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-7 h-[calc(100vh-10rem)] min-h-[650px]">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200/60 h-full flex flex-col relative overflow-hidden">
              
              {/* Header Panel Output */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-xl z-20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600">
                    <Newspaper size={22} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 tracking-tight">Hasil Tulisan</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output Preview</p>
                  </div>
                </div>

                {/* Action Bar */}
                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 sm:gap-4"
                    >
                      {/* Alignment Controls */}
                      <div className="hidden sm:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                        <button 
                          onClick={() => setTextAlign('left')}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            textAlign === 'left' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Kiri"
                        >
                          <AlignLeft size={16} />
                        </button>
                        <button 
                          onClick={() => setTextAlign('center')}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            textAlign === 'center' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Tengah"
                        >
                          <AlignCenter size={16} />
                        </button>
                        <button 
                          onClick={() => setTextAlign('right')}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            textAlign === 'right' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Kanan"
                        >
                          <AlignRight size={16} />
                        </button>
                        <button 
                          onClick={() => setTextAlign('justify')}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            textAlign === 'justify' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Kiri Kanan"
                        >
                          <AlignJustify size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                          title="Salin ke Clipboard"
                        >
                          {isCopied ? <CheckCircle size={18} className="text-green-600" /> : <Copy size={18} />}
                          <span className={cn("hidden sm:inline", isCopied ? "text-green-600" : "")}>{isCopied ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <button 
                          onClick={handlePrint}
                          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                          title="Cetak Artikel"
                        >
                          <Printer size={18} />
                          <span className="hidden sm:inline">Cetak</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content Area */}
              <div className="flex-grow overflow-y-auto relative z-10 p-10 md:p-12 scroll-smooth custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]">
                
                {/* Empty State */}
                {status === 'empty' && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <Newspaper size={48} className="text-slate-200" />
                    </div>
                    <p className="text-slate-600 font-black text-xl tracking-tight">Kanvas Siap</p>
                    <p className="text-sm text-slate-400 mt-2 max-w-xs text-center font-medium leading-relaxed">Hasil tulisan AI akan ditampilkan di sini dengan format yang rapi dan profesional.</p>
                  </div>
                )}

                {/* Loading State */}
                {status === 'loading' && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Pen size={24} className="text-indigo-600 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-slate-600 font-bold mt-8 tracking-tight">Menyusun Kalimat Terbaik...</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Ini mungkin memakan waktu beberapa detik</p>
                  </div>
                )}

                {/* Error State */}
                {status === 'error' && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle size={32} className="text-red-500" />
                    </div>
                    <p className="text-red-600 font-medium text-center max-w-md px-4">{error}</p>
                    <button 
                      onClick={handleGenerate}
                      className="mt-4 flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw size={16} />
                      Coba Lagi
                    </button>
                  </div>
                )}

                {/* Result Content */}
                {status === 'success' && (
                  <div 
                    ref={resultRef} 
                    className="font-serif prose prose-slate prose-lg max-w-none text-slate-800"
                    style={{ textAlign: textAlign }}
                  >
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10"
            >
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Settings size={18} className="text-amber-500" />
                  Pengaturan API Key
                </h3>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Gemini API Key</label>
                  <div className="relative group">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full p-4 pl-5 pr-24 bg-slate-50/50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-mono text-slate-800 placeholder:font-sans placeholder:text-slate-400" 
                      placeholder="Kosongkan = Default"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title={showApiKey ? "Sembunyikan" : "Tampilkan"}
                      >
                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        onClick={pasteApiKey}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Tempel dari Clipboard"
                      >
                        <Clipboard size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                    <p className="text-[11px] text-indigo-700 font-medium leading-relaxed flex gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <span>Aplikasi otomatis menggunakan kuota bawaan jika dikosongkan. Masukkan key dari Google AI Studio untuk memakai kuota pribadi Anda.</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 hover:shadow-indigo-100 active:scale-95"
                >
                  Simpan & Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Container */}
      <div id="print-area" className="hidden print:block p-10 bg-white text-black font-serif">
        <div className="prose prose-slate prose-lg max-w-none" style={{ textAlign: textAlign }}>
          <ReactMarkdown>{result}</ReactMarkdown>
        </div>
       
      </div>

      <style>{`
        /* Sembunyikan Vercel Toolbar */
        #__next-build-watcher, 
        .vercel-toolbar, 
        [class*="vercel-toolbar"],
        #vercel-live-feedback-widget,
        [id*="vercel-toolbar"] {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* Indentasi Paragraf */
        .prose p {
          text-indent: 1.5rem;
          margin-bottom: 1.75rem;
          line-height: 1.8;
          color: #334155;
          break-inside: avoid;
        }
        
        /* Judul otomatis rata tengah */
        .prose h1 {
          text-indent: 0 !important;
          text-align: center !important;
          margin-left: auto !important;
          margin-right: auto !important;
          width: 100% !important;
          display: block !important;
          font-size: 2rem !important;
          line-height: 1.2 !important;
          margin-top: 0 !important;
          margin-bottom: 2.5rem !important;
          font-weight: 900 !important;
          letter-spacing: -0.025em !important;
          color: #0f172a !important;
        }
        
        /* Subjudul tidak boleh di-indent */
        .prose h2 {
          text-indent: 0 !important;
          font-size: 1.5rem !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1rem !important;
          font-weight: 800 !important;
          letter-spacing: -0.025em !important;
          color: #1e293b !important;
        }
        
        .prose h3 {
          text-indent: 0 !important;
          font-size: 1.25rem !important;
          margin-top: 2rem !important;
          margin-bottom: 0.75rem !important;
          font-weight: 700 !important;
          color: #334155 !important;
        }
        
        .prose h4 {
          text-indent: 0 !important;
          font-size: 1.125rem !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.5rem !important;
          font-weight: 700 !important;
          color: #475569 !important;
        }

        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            padding: 0 !important;
          }
          .prose h1, .prose h2, .prose h3, .prose h4 {
            break-after: avoid;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
