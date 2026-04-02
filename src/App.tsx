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

    const userPrompt = `Buatkan tulisan berdasarkan informasi/fakta berikut:\n\n${topic}\n\nInstruksi Penting:\n1. Tuliskan tepat sebanyak ${paragraphs} paragraf (tidak termasuk judul utama).\n2. Berikan Judul Utama di baris paling atas menggunakan format Header Markdown (misal: # Judul Tulisan).\n3. Pastikan gaya penulisannya sangat kental dengan gaya yang diminta.\n4. Gunakan tata bahasa Indonesia yang baik, benar, dan sesuai dengan kaidah EYD (Ejaan Yang Disempurnakan) yang terbaru.\n5. Pastikan struktur paragraf jelas dan mengalir secara logis.\n6. Setiap awal paragraf harus menjorok ke dalam (indentasi) seperti format surat atau buku resmi.\n7. Pisahkan setiap paragraf dengan DUA baris baru (double newline) agar terbaca sebagai paragraf yang terpisah dalam format Markdown.`;
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
      
      if (err.message?.includes('503') || err.message?.includes('high demand')) {
        userFriendlyError = 'Server Gemini sedang sangat sibuk (High Demand). Silakan coba lagi dalam beberapa menit, atau gunakan API Key pribadi Anda di menu Pengaturan untuk prioritas lebih tinggi.';
      } else if (err.message?.includes('API_KEY_INVALID')) {
        userFriendlyError = 'API Key yang Anda masukkan tidak valid. Silakan periksa kembali di menu Pengaturan.';
      }
      
      setError(userFriendlyError);
      setStatus('error');
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      // Primary method: navigator.clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(result);
      } else {
        // Fallback method: textarea
        const textArea = document.createElement("textarea");
        textArea.value = result;
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white/70 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Pen size={20} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">AI Writer Pro</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0" />
              
              <div className="relative z-10 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">Buat Tulisan Baru</h2>
                  <p className="text-sm text-slate-500">Masukkan fakta, pilih gaya, dan biarkan AI bekerja.</p>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <AlignLeft size={16} className="text-indigo-500" />
                    Fakta atau Topik Utama
                  </label>
                  <textarea 
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={5} 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-slate-800" 
                    placeholder="Contoh: Terjadi lonjakan penggunaan AI di kalangan mahasiswa untuk mengerjakan tugas akhir..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Paragraph Count */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <ListOrdered size={16} className="text-indigo-500" />
                      Jumlah Paragraf
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={paragraphs}
                        onChange={(e) => setParagraphs(parseInt(e.target.value) || 0)}
                        onFocus={(e) => e.target.select()}
                        min={1} 
                        max={20} 
                        className="w-full p-3 pl-4 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">Max 20</span>
                    </div>
                  </div>

                  {/* Category Select */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                      <Folders size={16} className="text-indigo-500" />
                      Kategori
                    </label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value as WritingStyle['category'])}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 font-medium appearance-none cursor-pointer"
                    >
                      <option value="Jurnalistik">Jurnalistik</option>
                      <option value="Esai">Esai Akademik</option>
                      <option value="Khusus">Hiburan & Khusus</option>
                    </select>
                  </div>
                </div>

                {/* Style Selection */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Palette size={16} className="text-indigo-500" />
                    Gaya Penulisan
                  </label>
                  <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 rounded-xl custom-scrollbar">
                    {filteredStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyleId(style.id)}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border transition-all text-left",
                          selectedStyleId === style.id 
                            ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300" 
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="mt-1 flex-shrink-0">
                          <div className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center",
                            selectedStyleId === style.id ? "border-indigo-600" : "border-slate-300"
                          )}>
                            {selectedStyleId === style.id && <div className="w-2 h-2 bg-indigo-600 rounded-full" />}
                          </div>
                        </div>
                        <div>
                          <p className={cn(
                            "font-bold text-sm",
                            selectedStyleId === style.id ? "text-indigo-900" : "text-slate-800"
                          )}>{style.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{style.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="pt-2">
                  <button 
                    onClick={handleGenerate}
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 disabled:bg-indigo-400 text-white py-4 px-6 rounded-2xl font-bold transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {status === 'loading' ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <Wand2 size={20} />
                    )}
                    <span>{status === 'loading' ? 'Menyusun...' : 'Buat Tulisan Sekarang'}</span>
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
          <div className="lg:col-span-7 h-[calc(100vh-8rem)] min-h-[600px]">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col relative overflow-hidden">
              
              {/* Header Panel Output */}
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                    <Newspaper size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800">Hasil Tulisan</h3>
                </div>

                {/* Action Bar */}
                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-4"
                    >
                      {/* Alignment Controls */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button 
                          onClick={() => setTextAlign('left')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            textAlign === 'left' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Kiri"
                        >
                          <AlignLeft size={16} />
                        </button>
                        <button 
                          onClick={() => setTextAlign('center')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            textAlign === 'center' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Tengah"
                        >
                          <AlignCenter size={16} />
                        </button>
                        <button 
                          onClick={() => setTextAlign('right')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            textAlign === 'right' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Kanan"
                        >
                          <AlignRight size={16} />
                        </button>
                        <button 
                          onClick={() => setTextAlign('justify')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            textAlign === 'justify' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                          )}
                          title="Rata Kiri Kanan"
                        >
                          <AlignJustify size={16} />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button 
                          onClick={handleCopy}
                          className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm"
                          title="Salin ke Clipboard"
                        >
                          {isCopied ? <CheckCircle size={16} className="text-green-600 sm:w-[18px] sm:h-[18px]" /> : <Copy size={16} className="sm:w-[18px] sm:h-[18px]" />}
                          <span className={cn("hidden sm:inline", isCopied ? "text-green-600" : "")}>{isCopied ? 'Tersalin' : 'Salin'}</span>
                        </button>
                        <button 
                          onClick={handlePrint}
                          className="flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs sm:text-sm font-medium text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          title="Cetak Artikel"
                        >
                          <Printer size={16} className="sm:w-[18px] sm:h-[18px]" />
                          <span className="hidden sm:inline">Cetak</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Content Area */}
              <div className="flex-grow overflow-y-auto relative z-10 p-8 scroll-smooth custom-scrollbar">
                
                {/* Empty State */}
                {status === 'empty' && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <Newspaper size={64} className="text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">Kanvas siap.</p>
                    <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">Hasil generate AI akan ditampilkan di sini dalam format yang rapi.</p>
                  </div>
                )}

                {/* Loading State */}
                {status === 'loading' && (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="flex gap-2 mb-8">
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                        className="w-3 h-3 bg-indigo-600 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-3 h-3 bg-indigo-600 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-3 h-3 bg-indigo-600 rounded-full" 
                      />
                    </div>
                    <p className="text-slate-500 font-medium mt-4 animate-pulse">Menyusun kalimat...</p>
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
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Gemini API Key</label>
                  <div className="relative">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full p-3 pl-4 pr-20 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-mono text-slate-800 placeholder:font-sans placeholder:text-slate-400" 
                      placeholder="Kosongkan = Default"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button 
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        onClick={pasteApiKey}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Clipboard size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Aplikasi otomatis menggunakan kuota bawaan jika dikosongkan. Masukkan key dari Google AI Studio untuk memakai kuota pribadi Anda.
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
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
        <div className="mt-10 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 font-sans">
          Dihasilkan oleh AI Writer Pro — Dokumen ini dibuat menggunakan Kecerdasan Buatan (AI)
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
          text-indent: 1.25rem;
          margin-bottom: 1.5rem;
        }
        
        /* Judul tidak boleh di-indent */
        .prose h1, .prose h2, .prose h3, .prose h4 {
          text-indent: 0;
        }

        @media print {
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
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
