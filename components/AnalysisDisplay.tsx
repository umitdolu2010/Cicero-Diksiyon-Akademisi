
import React from 'react';
import { AnalysisResult, Language } from '../types';
import { gemini } from '../services/geminiService';

interface Props {
  result: AnalysisResult | null;
  isLoading: boolean;
}

export const AnalysisDisplay: React.FC<Props> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-slate-900/60 p-12 rounded-[4rem] border border-slate-800 animate-pulse flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-24 h-24 bg-slate-800 rounded-full mb-10"></div>
        <div className="space-y-4 w-full">
          <div className="h-4 bg-slate-800 rounded-full w-3/4 mx-auto"></div>
          <div className="h-4 bg-slate-800 rounded-full w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const playOwnRecording = () => {
    if (result.audioUrl) {
      const audio = new Audio();
      audio.src = result.audioUrl;
      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        alert("Ses kaydı yüklenemedi. Lütfen tekrar deneyin.");
      };
      audio.play().catch(err => {
        console.error("Audio play promise failed:", err);
      });
    }
  };

  const playModelReference = () => {
    if (result.modelText) {
      gemini.speak(result.modelText, Language.TR); 
    }
  };

  return (
    <div className="bg-slate-900 p-12 rounded-[4rem] border border-slate-800 shadow-[0_40px_100px_rgba(0,0,0,0.5)] space-y-12 animate-in fade-in zoom-in-95 duration-1000 relative overflow-hidden">
      {/* Subtle Background Articulation Shape */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none -mr-32 -mt-32"></div>

      {/* Coaching Header */}
      <div className="flex justify-between items-center pb-6 border-b border-slate-800/50">
        <div className="flex-1">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.6em]">ÖZEL SEANS RAPORU</span>
          <h3 className="text-4xl font-black text-white mt-2 tracking-tighter leading-tight">{result.exerciseTitle}</h3>
        </div>
        <div className="relative flex items-center justify-center scale-110">
            <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-950" />
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={`${result.score * 3.01} 301`} className="text-indigo-500 transition-all duration-1500 ease-out shadow-[0_0_20px_rgba(99,102,241,0.4)]" />
            </svg>
            <span className="absolute text-3xl font-black text-white">{result.score}</span>
        </div>
      </div>
      
      {/* Audio Comparison Controls */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={playOwnRecording}
          className="flex flex-col items-center gap-3 p-8 bg-slate-950/50 rounded-[2.5rem] border border-slate-800 hover:border-rose-500/30 transition-all active:scale-95 group"
        >
          <div className="w-14 h-14 bg-rose-600/10 rounded-full flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
             </svg>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">KAYDIMI DİNLE</span>
        </button>

        <button 
          onClick={playModelReference}
          className="flex flex-col items-center gap-3 p-8 bg-slate-950/50 rounded-[2.5rem] border border-slate-800 hover:border-indigo-500/30 transition-all active:scale-95 group"
        >
          <div className="w-14 h-14 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
             </svg>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MODELİ DİNLE</span>
        </button>
      </div>

      {/* Main Feedback Summary */}
      <div className="bg-slate-950 p-12 rounded-[3.5rem] border border-slate-800 shadow-inner relative overflow-hidden space-y-4">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
        <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-[0.5em]">TEKNİK DEĞERLENDİRME</h4>
        <p className="text-2xl text-slate-100 font-bold leading-relaxed italic tracking-tight">
          "{result.trendAwareSummary}"
        </p>
      </div>
      
      {/* Advanced Micro-metrics Grid */}
      <div className="space-y-10">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] pl-4">FONETİK HASSASİYET ANALİZİ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
            <MetricBar label="Konsonant Atak (Vuruş)" value={result.consonantAttack} color="bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            <MetricBar label="Konsonant Bırakış Süresi" value={result.consonantReleaseDuration} color="bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]" />
            <MetricBar label="Vokal Stabilite (Tınlama)" value={result.vowelStability} color="bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]" />
            <MetricBar label="Nefes Onset Varyansı" value={result.breathOnsetVariance} color="bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
            <MetricBar label="Akış Tutarlılığı" value={result.consistency} color="bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <MetricBar label="Tereddüt Kontrolü" value={100 - result.hesitationLevel} color="bg-emerald-600 shadow-[0_0_15px_rgba(5,150,105,0.5)]" />
        </div>
      </div>

      {/* Focused Recommendation */}
      <div className="bg-indigo-900/10 p-12 rounded-[3rem] border border-indigo-500/10 flex gap-8 items-start backdrop-blur-3xl">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner border border-indigo-500/20">
           🎯
        </div>
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.6em]">SONRAKİ HEDEF</h4>
          <p className="text-xl text-indigo-100/90 font-medium leading-tight tracking-tighter">{result.recommendation}</p>
        </div>
      </div>
    </div>
  );
};

const MetricBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end px-3">
      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</span>
      <span className="text-sm font-black text-white">{Math.round(value)}%</span>
    </div>
    <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner p-[2px]">
      <div 
        className={`${color} h-full rounded-full transition-all duration-1500 ease-out`} 
        style={{ width: `${value}%` }}
      ></div>
    </div>
  </div>
);
