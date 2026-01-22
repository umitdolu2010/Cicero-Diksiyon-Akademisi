
import React, { useState, useEffect, useRef } from 'react';
import { Tab, Difficulty, Exercise, UserProgress, AnalysisResult, Language, ModuleCategory } from './types';
import { EXERCISES, COLORS, MODULES } from './constants';
import { gemini } from './services/geminiService';
import { Waveform } from './components/Waveform';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { SyllableDisplay } from './components/SyllableDisplay';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [user, setUser] = useState<UserProgress | null>(null);
  const [userNameInput, setUserNameInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.TR);
  
  // Exercises States
  const [activeModule, setActiveModule] = useState<ModuleCategory | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseStep, setExerciseStep] = useState<'IDLE' | 'LISTENING' | 'RECORDING' | 'FINISHED'>('IDLE');
  
  // Navigation & Feedback States
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [earTrainingWord, setEarTrainingWord] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const hasGuidedRef = useRef(false);
  const analysisSummarySpokenRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('cicero_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed);
      setSelectedLanguage(parsed.preferredLanguage || Language.TR);
    }
  }, []);

  const speakWithCue = async (text: string, delay: number = 300) => {
    setTimeout(async () => {
      try {
        await gemini.speak(text, selectedLanguage);
      } catch (e: any) {
        console.error("Speech failed", e);
        const errStr = JSON.stringify(e).toLowerCase();
        if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted')) {
          setApiError("quota");
        }
      }
    }, delay);
  };

  // Orientation: Initial App Launch
  useEffect(() => {
    if (activeTab === Tab.HOME && user && !hasGuidedRef.current) {
      const welcomeMessages: Record<Language, string> = {
        [Language.TR]: "Sisteme giriş yapıldı. Ben Cicero. Burada sesini değil, ifadenin teknik gücünü geliştireceğiz. Duyguya yer yok, metot esastır. Sadece talimatlarımı takip et.",
        [Language.EN]: "System access granted. I am Cicero. We will develop the technical power of your expression, not your voice. Method over emotion. Follow my instructions.",
        [Language.DE]: "Systemzugriff gewährt. Ich bin Cicero. Wir werden die technische Kraft deines Ausdrucks entwickeln. Methode vor Emotion. Folge meinen Anweisungen."
      };
      speakWithCue(welcomeMessages[selectedLanguage], 800);
      hasGuidedRef.current = true;
    }
  }, [activeTab, user, selectedLanguage]);

  // Reflection: Analysis Tab
  useEffect(() => {
    if (activeTab === Tab.ANALYSIS && user && user.history.length > 0 && !analysisSummarySpokenRef.current) {
      const latest = user.history[0];
      speakWithCue(latest.trendAwareSummary, 500);
      analysisSummarySpokenRef.current = true;
    }
    if (activeTab !== Tab.ANALYSIS) analysisSummarySpokenRef.current = false;
  }, [activeTab, user, selectedLanguage]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProgress = {
      name: userNameInput,
      score: 0,
      exercisesCompleted: 0,
      streak: 1,
      lastAnalysis: null,
      history: [],
      preferredLanguage: Language.TR
    };
    setUser(newUser);
    localStorage.setItem('cicero_session', JSON.stringify(newUser));
  };

  // Instruction: Module Selection
  const selectModule = (moduleName: string) => {
    setActiveModule(moduleName as ModuleCategory);
    setSelectedExercise(null);
    setExerciseStep('IDLE');
    setApiError(null);

    const moduleExplanations: Record<string, Record<Language, string>> = {
      'Kulak Eğitimi': {
        [Language.TR]: "Kulak Eğitimi başlıyor. Hedef: fonetik farkındalık. Konuşmadan önce duymayı ve kusuru tespit etmeyi öğreneceksin.",
        [Language.EN]: "Ear Training starting. Goal: phonetic awareness. Learn to hear and detect flaws before you speak.",
        [Language.DE]: "Gehörbildung beginnt. Ziel: phonetisches Bewusstsein. Lerne zu hören und Mängel zu erkennen, bevor du sprichst."
      },
      'Heceleme & Tekerleme': {
        [Language.TR]: "Artikülasyon çalışması. Hedef: dudak ve dil kas hafızası. Hızlanma, netliğe odaklan.",
        [Language.EN]: "Articulation work. Goal: lip and tongue muscle memory. Do not rush, focus on clarity.",
        [Language.DE]: "Artikulationsarbeit. Ziel: Lippen- und Zungenmuskelgedächtnis. Nicht hetzen, auf Klarheit konzentrieren."
      },
      'Nefes Kontrolü': {
        [Language.TR]: "Nefes yönetimi. Hedef: diyafram kontrolü. Uzun cümlelerde hava yönetimini öğreneceksin.",
        [Language.EN]: "Breath management. Goal: diaphragm control. Learn air management in long sentences.",
        [Language.DE]: "Atemmanagement. Ziel: Zwerchfellkontrolle. Lerne das Luftmanagement in langen Sätzen."
      },
      'Tonlama & Vurgu': {
        [Language.TR]: "Tonlama analizi. Hedef: anlamlı vurgu noktaları. Sesindeki gereksiz dalgalanmaları kontrol altına alacağız.",
        [Language.EN]: "Intonation analysis. Goal: meaningful emphasis points. We will control unnecessary fluctuations in your voice.",
        [Language.DE]: "Intonationsanalyse. Ziel: sinnvolle Betonungspunkte. Wir werden unnötige Schwankungen in Ihrer Stimme kontrollieren."
      }
    };

    const msg = moduleExplanations[moduleName]?.[selectedLanguage] || `${moduleName} modülüne geçiyoruz.`;
    speakWithCue(msg, 300);
  };

  // Instruction: Exercise Selection
  const selectExercise = (ex: Exercise) => {
    setSelectedExercise(ex);
    setExerciseStep('LISTENING');
    setApiError(null);
    
    let instruction = "";
    if (ex.category === 'Kulak Eğitimi') {
      instruction = `Talimat: Önce bu fonetiği dinle ve hecelerin kapanış noktalarını fark et. Sonra senin denemeni isteyeceğim. Kayıt başlıyor: ${ex.text}`;
    } else {
      instruction = `Talimat: Önce benden duyduğun artikülasyon modelini analiz et. Şimdi sıra sana gelecek. Metin: ${ex.text}`;
    }
    speakWithCue(instruction, 500);
  };

  const searchEarTraining = (word: string) => {
    if (!word.trim()) return;
    const customEx: Exercise = {
      id: `custom_${Date.now()}`,
      title: word,
      text: word,
      difficulty: Difficulty.BEGINNER,
      language: selectedLanguage,
      category: 'Kulak Eğitimi'
    };
    selectExercise(customEx);
  };

  const safeBack = () => {
    if (isRecording || isAnalyzing) {
      setShowBackConfirm(true);
    } else if (selectedExercise) {
      setSelectedExercise(null);
      setExerciseStep('IDLE');
    } else if (activeModule) {
      setActiveModule(null);
    }
  };

  // Execution: Start Recording
  const startRecording = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
    }
    setIsRecording(true);
    setExerciseStep('RECORDING');
    setApiError(null);
    speakWithCue("Uygulama aşaması. Seni dinliyorum. Başla.", 0);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current!.createMediaStreamSource(stream);
      source.connect(analyserRef.current!);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(blob, mimeType);
      };
      mediaRecorder.start();
    } catch (err) {
      console.error("Recording error:", err);
      setIsRecording(false);
      setExerciseStep('LISTENING');
    }
  };

  // Reflection Start: Stop Recording
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    speakWithCue("Kayıt alındı. Teknik analiz süreci başlıyor. Bekle.", 100);
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    if (!selectedExercise) return;
    if (blob.size === 0) {
      console.warn("Audio blob is empty");
      setApiError("unknown");
      return;
    }
    setIsAnalyzing(true);
    setApiError(null);
    const audioUrl = URL.createObjectURL(blob);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const historyContext = user?.history.slice(0, 3).map(h => `${h.exerciseTitle}: ${h.score}`).join(", ") || "No history.";
      
      try {
        const result = await gemini.analyzeAudio(
          base64, 
          selectedExercise.text, 
          selectedLanguage,
          historyContext,
          mimeType
        );
        
        const fullResult: AnalysisResult = {
          ...result,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          exerciseTitle: selectedExercise.title,
          audioUrl: audioUrl,
          audioMimeType: mimeType,
          modelText: selectedExercise.text
        };
        
        const updatedUser = {
          ...user!,
          score: Math.round((user!.score * user!.exercisesCompleted + result.score) / (user!.exercisesCompleted + 1)),
          exercisesCompleted: user!.exercisesCompleted + 1,
          history: [fullResult, ...user!.history]
        };
        setUser(updatedUser);
        localStorage.setItem('cicero_session', JSON.stringify(updatedUser));
        setIsAnalyzing(false);
        setExerciseStep('FINISHED');
        speakWithCue("Analiz tamamlandı. Şimdi sonuçları teknik olarak değerlendireceğiz.", 200);
      } catch (e: any) {
        console.error("Analysis failed", e);
        setIsAnalyzing(false);
        const errStr = JSON.stringify(e).toLowerCase();
        if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('exhausted')) {
          setApiError("quota");
          speakWithCue("Sistem kotası aşıldı. Teknik analiz şu an yapılamıyor. Lütfen planınızı kontrol edin veya biraz bekleyin.", 0);
        } else {
          setApiError("unknown");
        }
      }
    };
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950">
        <div className="w-full max-w-sm space-y-12 animate-in fade-in zoom-in-95 duration-1000">
          <div className="text-center">
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4">CICERO <span className="text-indigo-500">AI</span></h1>
            <div className="flex items-center justify-center gap-2">
                <div className="h-0.5 w-8 bg-indigo-500/30"></div>
                <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Articulation Academy</p>
                <div className="h-0.5 w-8 bg-indigo-500/30"></div>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">PROFİL ADI</label>
               <input 
                 type="text" 
                 placeholder="İsminizi buraya yazın..." 
                 className="w-full bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] p-7 text-white text-xl font-bold placeholder:text-slate-700 focus:border-indigo-500 focus:bg-slate-800/50 transition-all outline-none shadow-xl"
                 value={userNameInput}
                 onChange={(e) => setUserNameInput(e.target.value)}
                 required
               />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-[2.5rem] font-black text-2xl text-white shadow-2xl shadow-indigo-600/20 active:scale-[0.97] transition-all duration-300">BAŞLAT</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden font-inter selection:bg-indigo-500 selection:text-white">
      
      {/* Error Overlay */}
      {apiError && (
        <div className="fixed top-0 left-0 right-0 z-[110] bg-rose-600 py-3 px-6 text-center animate-in slide-in-from-top duration-500">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">
            {apiError === 'quota' ? 'SİSTEM KOTASI DOLDU - LÜTFEN PLANINIZI KONTROL EDİN VEYA BEKLEYİN' : 'TEKNİK BİR HATA OLUŞTU'}
          </p>
        </div>
      )}

      {/* Back Confirmation Modal */}
      {showBackConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] w-full max-w-sm space-y-8 shadow-2xl">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-black text-white tracking-tight">İşlemi Durdur?</h3>
              <p className="text-slate-400 font-medium leading-relaxed">Teknik ilerleme kaydedilmeyecek. Emin misiniz?</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowBackConfirm(false);
                  setIsRecording(false);
                  setIsAnalyzing(false);
                  setSelectedExercise(null);
                  setExerciseStep('IDLE');
                  setApiError(null);
                  speakWithCue("Egzersiz iptal edildi.", 0);
                }}
                className="w-full bg-rose-600 py-5 rounded-[1.5rem] font-black text-white shadow-lg active:scale-95 transition-all"
              >
                İPTAL ET
              </button>
              <button 
                onClick={() => setShowBackConfirm(false)}
                className="w-full bg-slate-800 py-5 rounded-[1.5rem] font-black text-slate-300 active:scale-95 transition-all"
              >
                DEVAM ET
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-36 px-6 pt-16 scroll-smooth">
        
        {activeTab === Tab.HOME && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex justify-between items-start">
              <header className="space-y-1">
                <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em]">MASTER KOÇ</p>
                <h3 className="text-5xl font-black text-white tracking-tighter leading-none">{user.name}</h3>
              </header>
              <button 
                onClick={() => setActiveTab(Tab.PROFILE)}
                className="w-16 h-16 bg-slate-900 rounded-[2rem] border border-slate-800 flex items-center justify-center shadow-2xl hover:bg-slate-800 transition-colors"
              >
                <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-10 shadow-2xl shadow-indigo-500/10 relative overflow-hidden group active:scale-[0.98] transition-transform duration-500 cursor-pointer" onClick={() => setActiveTab(Tab.EXERCISES)}>
              <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10 space-y-4">
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-indigo-200/60">GÜNLÜK METOT</span>
                <h4 className="text-3xl font-black text-white leading-none tracking-tighter">Fonetik <br/> Akış Kontrolü</h4>
                <div className="flex items-center gap-3 pt-2">
                    <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white w-1/3 rounded-full"></div>
                    </div>
                    <span className="text-[10px] font-black text-white/80">3/10</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800/50 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-xl">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">GLOBAL PUAN</span>
                <p className="text-4xl font-black text-white tracking-tighter">{user.score}</p>
              </div>
              <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800/50 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-xl">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">SÜREKLİLİK</span>
                <p className="text-4xl font-black text-white tracking-tighter">{user.streak}</p>
              </div>
            </div>

            <div className="pt-8">
              <button 
                onClick={() => { setActiveTab(Tab.EXERCISES); speakWithCue("Eğitim modüllerine geçiyoruz. Birini seç.", 200); }}
                className="w-full bg-white hover:bg-slate-100 text-slate-950 rounded-[3rem] py-9 flex flex-col items-center justify-center gap-4 shadow-[0_30px_80px_rgba(255,255,255,0.05)] transition-all active:scale-95 group"
              >
                <div className="bg-indigo-600 p-6 rounded-full shadow-2xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-2xl font-black uppercase tracking-tighter">EĞİTİME BAŞLA</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === Tab.EXERCISES && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-700">
            {!activeModule ? (
              <div className="space-y-8">
                <h2 className="text-5xl font-black text-white tracking-tighter leading-none">Eğitim <br/> Modülleri</h2>
                <div className="grid grid-cols-1 gap-5">
                  {MODULES.map(module => (
                    <button 
                      key={module.id}
                      onClick={() => selectModule(module.name)}
                      className="bg-slate-900/30 p-8 rounded-[3rem] border border-slate-800/80 text-left flex items-center gap-8 group hover:bg-slate-800 hover:border-indigo-500/50 transition-all active:scale-[0.98] shadow-2xl backdrop-blur-md"
                    >
                      <div className="w-20 h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center text-4xl group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 border border-slate-800 shadow-inner">
                        {module.icon}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-2xl font-black text-white tracking-tighter">{module.name}</h4>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{module.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : !selectedExercise ? (
              <div className="space-y-8">
                <button onClick={safeBack} className="text-indigo-400 text-xs font-black flex items-center gap-3 uppercase tracking-[0.3em] group bg-slate-900/40 px-6 py-4 rounded-full border border-slate-800 w-fit active:scale-90 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" />
                  </svg>
                  GERİ
                </button>
                <div className="space-y-2">
                    <span className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.5em] ml-2">MÜFREDAT</span>
                    <h2 className="text-5xl font-black text-white tracking-tighter leading-none">{activeModule}</h2>
                </div>

                {activeModule === 'Kulak Eğitimi' && (
                  <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 space-y-6 shadow-2xl">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">ÖZEL FONETİK ANALİZ</label>
                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            placeholder="Kelime yaz..."
                            className="flex-1 bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] px-6 py-5 outline-none focus:border-indigo-500 transition-all font-bold text-lg shadow-inner"
                            value={earTrainingWord}
                            onChange={(e) => setEarTrainingWord(e.target.value)}
                        />
                        <button 
                            onClick={() => { searchEarTraining(earTrainingWord); speakWithCue(`"${earTrainingWord}" analizi seçildi.`, 100); }}
                            className="bg-indigo-600 hover:bg-indigo-500 px-8 rounded-[1.5rem] font-black active:scale-90 transition-all shadow-xl shadow-indigo-600/20"
                        >
                            DENE
                        </button>
                    </div>
                  </div>
                )}

                <div className="space-y-5 pt-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] pl-6">EGZERSİZ LİSTESİ</h3>
                  {EXERCISES.filter(e => e.language === selectedLanguage && e.category === activeModule).map(ex => (
                    <button 
                      key={ex.id}
                      onClick={() => selectExercise(ex)}
                      className="w-full bg-slate-900/60 p-10 rounded-[3rem] border border-slate-800 text-left group hover:border-indigo-500/50 transition-all shadow-xl backdrop-blur-sm relative overflow-hidden active:scale-[0.98]"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] pointer-events-none"></div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">SEVİYE {ex.difficulty.toUpperCase()}</span>
                        <div className={`w-3 h-3 rounded-full ${COLORS[ex.difficulty]} shadow-lg`}></div>
                      </div>
                      <h4 className="text-2xl font-black text-white tracking-tighter leading-tight">{ex.title}</h4>
                      <p className="text-slate-500 text-sm mt-4 line-clamp-2 italic font-medium opacity-60 leading-relaxed">"{ex.text}"</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in zoom-in-95 duration-700 pb-16">
                <button onClick={safeBack} className="text-indigo-400 text-xs font-black flex items-center gap-3 uppercase tracking-[0.3em] group bg-slate-900/40 px-6 py-4 rounded-full border border-slate-800 w-fit active:scale-90 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M15 19l-7-7 7-7" />
                  </svg>
                  GERİ
                </button>
                
                <div className="space-y-8">
                  <header className="space-y-2">
                    <span className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.5em] ml-2">{activeModule}</span>
                    <h2 className="text-5xl font-black leading-tight tracking-tighter">{selectedExercise.title}</h2>
                  </header>

                  {activeModule === 'Heceleme & Tekerleme' ? (
                    <SyllableDisplay text={selectedExercise.text} isActive={exerciseStep === 'RECORDING'} />
                  ) : (
                    <div className="bg-slate-900/60 p-16 rounded-[4rem] border border-slate-800/80 shadow-2xl relative overflow-hidden text-center group backdrop-blur-3xl min-h-[250px] flex items-center justify-center">
                        <div className="absolute top-10 right-10 flex gap-3">
                           <div className={`w-4 h-4 rounded-full transition-all duration-500 ${exerciseStep === 'LISTENING' ? 'bg-indigo-500 animate-pulse scale-125' : 'bg-slate-800'}`}></div>
                           <div className={`w-4 h-4 rounded-full transition-all duration-500 ${exerciseStep === 'RECORDING' ? 'bg-rose-500 animate-pulse scale-125' : 'bg-slate-800'}`}></div>
                        </div>
                        <p className="text-4xl font-black text-white leading-snug tracking-tighter group-hover:scale-105 transition-all duration-1000 ease-out px-4">
                          {selectedExercise.text}
                        </p>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {exerciseStep === 'LISTENING' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                      <div className="bg-indigo-600/10 py-10 px-12 rounded-[3rem] border border-indigo-500/20 flex flex-col items-center justify-center gap-6 shadow-inner backdrop-blur-md">
                         <div className="relative">
                            <div className="w-12 h-12 bg-indigo-500/20 rounded-full animate-ping absolute inset-0"></div>
                            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center relative">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                               </svg>
                            </div>
                         </div>
                         <p className="text-xs font-black text-indigo-300 uppercase tracking-[0.4em]">CICERO ÖRNEK MODELİ</p>
                      </div>
                      <button 
                        onClick={startRecording}
                        className="w-full bg-white text-slate-950 py-10 rounded-[3.5rem] font-black text-3xl flex items-center justify-center gap-5 uppercase tracking-tighter shadow-[0_30px_90px_rgba(255,255,255,0.1)] hover:bg-indigo-50 active:scale-95 transition-all duration-300"
                      >
                        SIRADA SEN VARSIN
                      </button>
                    </div>
                  )}

                  {exerciseStep === 'RECORDING' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                      <Waveform analyser={analyserRef.current} isActive={isRecording} color="#f43f5e" />
                      <button 
                        onClick={stopRecording}
                        className="w-full bg-rose-600 py-10 rounded-[3.5rem] font-black text-3xl text-white shadow-2xl shadow-rose-600/40 flex items-center justify-center gap-5 animate-pulse uppercase tracking-tighter active:scale-95 transition-all duration-300"
                      >
                        KAYDI TAMAMLA
                      </button>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="flex flex-col items-center gap-10 py-20 animate-in zoom-in-95 duration-500">
                       <div className="relative w-24 h-24">
                          <div className="absolute inset-0 border-8 border-indigo-600/10 rounded-full"></div>
                          <div className="absolute inset-0 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(79,70,229,0.3)]"></div>
                          <div className="absolute inset-4 bg-slate-900 rounded-full flex items-center justify-center">
                             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                          </div>
                       </div>
                       <div className="text-center space-y-2">
                           <p className="text-lg font-black text-indigo-400 uppercase tracking-[0.4em]">TEKNİK ANALİZ</p>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fonetik birimler metodik olarak ayrıştırılıyor...</p>
                       </div>
                    </div>
                  )}

                  {apiError && !isAnalyzing && (
                    <div className="bg-rose-900/20 p-10 rounded-[3rem] border border-rose-500/20 text-center animate-in zoom-in-95 duration-300">
                       <h3 className="text-rose-500 font-black text-2xl tracking-tighter mb-4 uppercase">BAĞLANTI SORUNU</h3>
                       <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                         {apiError === 'quota' 
                            ? 'Sistem kotası aşıldı. Lütfen API kullanım planınızı kontrol edin veya bir dakika bekleyip tekrar deneyin.' 
                            : 'Teknik bir aksaklık oluştu. Lütfen bağlantınızı kontrol edip tekrar deneyin.'}
                       </p>
                       <button 
                          onClick={() => { setApiError(null); setExerciseStep('LISTENING'); }}
                          className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all active:scale-90"
                       >
                          TEKRAR DENE
                       </button>
                    </div>
                  )}

                  {exerciseStep === 'FINISHED' && !apiError && (
                    <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-5">
                      <div className="bg-emerald-600/10 p-12 rounded-[4rem] border border-emerald-500/20 text-center shadow-inner backdrop-blur-md">
                         <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                            </svg>
                         </div>
                         <h3 className="text-emerald-400 font-black text-3xl tracking-tighter mb-2 uppercase">BAŞARDIN!</h3>
                         <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.3em]">Hemen teknik raporu hazırla.</p>
                      </div>
                      <button 
                        onClick={() => { setActiveTab(Tab.ANALYSIS); setSelectedExercise(null); setActiveModule(null); }}
                        className="w-full bg-indigo-600 py-8 rounded-[2.5rem] font-black text-2xl text-white uppercase tracking-tighter shadow-2xl shadow-indigo-600/40 active:scale-95 transition-all duration-300"
                      >
                        RAPORU GÖRÜNTÜLE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === Tab.ANALYSIS && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <header className="space-y-2">
              <h2 className="text-5xl font-black text-white tracking-tighter leading-none">Gelişim <br/> Analizi</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] mt-4">Teknik Veri Odası</p>
            </header>

            {user.history.length === 0 ? (
              <div className="bg-slate-900/40 p-24 rounded-[4rem] border border-slate-800 text-center opacity-40 shadow-inner backdrop-blur-md">
                <div className="text-6xl mb-8 animate-bounce">📊</div>
                <p className="font-black text-xs uppercase tracking-[0.4em]">VERİ TOPLANIYOR...</p>
              </div>
            ) : (
              <div className="space-y-16">
                <AnalysisDisplay result={user.history[0]} isLoading={isAnalyzing} />
                
                <div className="space-y-8 pb-10">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] pl-6">YOLCULUK KAYITLARI</h3>
                  <div className="space-y-4">
                    {user.history.map(h => (
                      <div key={h.id} className="bg-slate-900/60 p-10 rounded-[3rem] border border-slate-800/80 flex justify-between items-center group active:scale-[0.98] transition-all shadow-xl hover:border-indigo-500/40 backdrop-blur-sm">
                        <div className="flex items-center gap-8">
                          <div className="w-14 h-14 bg-slate-800 rounded-[1.5rem] flex items-center justify-center font-black text-base text-indigo-400 shadow-inner border border-slate-700">
                            {h.score}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-black text-white text-xl tracking-tighter leading-none">{h.exerciseTitle}</h4>
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">
                              {new Date(h.date).toLocaleDateString(selectedLanguage === Language.TR ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === Tab.PROFILE && (
          <div className="space-y-16 animate-in fade-in slide-in-from-right-10 duration-1000 pb-20">
            <div className="flex flex-col items-center text-center pt-10">
              <div className="w-40 h-40 bg-gradient-to-tr from-indigo-800 to-indigo-400 rounded-full flex items-center justify-center text-7xl font-black text-white mb-10 shadow-[0_40px_100px_rgba(79,70,229,0.4)] border-[10px] border-slate-950 relative scale-110">
                {user.name[0].toUpperCase()}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500 border-[6px] border-slate-950 rounded-full flex items-center justify-center text-lg shadow-xl">
                    ✓
                </div>
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter">{user.name}</h2>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]"></div>
                <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.5em]">PLATINUM ÜYE</p>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] pl-8">TERCİH EDİLEN DİL</label>
                <div className="grid grid-cols-3 gap-5 px-2">
                  {[Language.TR, Language.EN, Language.DE].map(lang => (
                    <button 
                      key={lang}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        const updated = {...user, preferredLanguage: lang};
                        setUser(updated);
                        localStorage.setItem('cicero_session', JSON.stringify(updated));
                        speakWithCue(`Sistem dili ${lang} olarak güncellendi. Metot değişmez.`, 0);
                        setActiveModule(null);
                        setSelectedExercise(null);
                        setApiError(null);
                      }}
                      className={`py-8 rounded-[2.5rem] font-black text-sm border-2 transition-all active:scale-90 shadow-2xl ${selectedLanguage === lang ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-600'}`}
                    >
                      {lang.substring(0, 2).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] pl-8">AKADEMİ VERİLERİ</label>
                <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-12 space-y-10 shadow-3xl backdrop-blur-xl">
                  <div className="flex justify-between items-end">
                    <span className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">EGZERSİZ TAMAMLAMA</span>
                    <span className="font-black text-5xl text-white tracking-tighter">{user.history.length}</span>
                  </div>
                  <div className="h-px bg-slate-800/50 w-full"></div>
                  <div className="flex justify-between items-end">
                    <span className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em]">TEKNİK SKOR</span>
                    <span className="font-black text-5xl text-indigo-400 tracking-tighter">{user.score}</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  speakWithCue("Oturum kapatılıyor. Çalışmayı bırakma.", 0);
                  setTimeout(() => {
                    localStorage.removeItem('cicero_session');
                    window.location.reload();
                  }, 1200);
                }}
                className="w-full text-rose-500 font-black text-[10px] uppercase tracking-[0.6em] py-8 bg-rose-500/5 rounded-[2.5rem] border-2 border-rose-500/10 active:scale-[0.98] transition-all hover:bg-rose-500/10 shadow-lg mt-4"
              >
                ÇIKIŞ YAP
              </button>
            </div>
          </div>
        )}

      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-[40px] border-t border-slate-800/40 px-8 pt-6 pb-12 flex justify-between items-center z-[90] shadow-[0_-40px_80px_rgba(0,0,0,0.9)]">
        <NavButton active={activeTab === Tab.HOME} onClick={() => { setActiveTab(Tab.HOME); setActiveModule(null); setSelectedExercise(null); setApiError(null); }} label="HOME" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        }/>
        <NavButton active={activeTab === Tab.EXERCISES} onClick={() => { setActiveTab(Tab.EXERCISES); setApiError(null); }} label="COACH" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        }/>
        <NavButton active={activeTab === Tab.ANALYSIS} onClick={() => { setActiveTab(Tab.ANALYSIS); setActiveModule(null); setSelectedExercise(null); setApiError(null); }} label="DATA" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }/>
        <NavButton active={activeTab === Tab.PROFILE} onClick={() => { setActiveTab(Tab.PROFILE); setActiveModule(null); setSelectedExercise(null); setApiError(null); }} label="USER" icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }/>
      </nav>
    </div>
  );
};

const NavButton: React.FC<{active: boolean, onClick: () => void, icon: React.ReactNode, label: string}> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2.5 flex-1 transition-all active:scale-75 duration-300">
    <div className={`p-5 rounded-[2.25rem] transition-all duration-500 ease-out ${active ? 'text-white bg-indigo-600 shadow-[0_20px_50px_rgba(79,70,229,0.5)] scale-110 -translate-y-2' : 'text-slate-700 hover:text-slate-500'}`}>
      {icon}
    </div>
    <span className={`text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${active ? 'text-white opacity-100 scale-100' : 'text-slate-800 opacity-40 scale-90'}`}>{label}</span>
  </button>
);

export default App;
