
export enum Difficulty {
  BEGINNER = 'Başlangıç',
  INTERMEDIATE = 'Orta',
  ADVANCED = 'İleri'
}

export enum Language {
  TR = 'Turkish',
  EN = 'English',
  DE = 'German'
}

export enum TrainingMode {
  NORMAL = 'Normal',
  SYLLABLE = 'Heceleme',
  SPEED = 'Hızlandırma',
  BREATH = 'Nefes Kontrolü',
  LISTENING = 'Kulak Eğitimi'
}

export enum Tab {
  HOME = 'Home',
  EXERCISES = 'Exercises',
  ANALYSIS = 'Analysis',
  PROFILE = 'Profile'
}

export type ModuleCategory = 'Kulak Eğitimi' | 'Heceleme & Tekerleme' | 'Nefes Kontrolü' | 'Tonlama & Vurgu';

export interface Exercise {
  id: string;
  title: string;
  text: string;
  difficulty: Difficulty;
  language: Language;
  category: ModuleCategory;
}

export interface UserProgress {
  name: string;
  score: number;
  exercisesCompleted: number;
  streak: number;
  lastAnalysis: string | null;
  history: AnalysisResult[];
  preferredLanguage: Language;
}

export interface AnalysisResult {
  id: string;
  date: string;
  exerciseTitle: string;
  score: number;
  phoneticClarity: number;
  flowRhythm: number;
  breathControl: number;
  consistency: number;
  // Advanced micro-metrics
  consonantAttack: number;
  vowelStability: number;
  hesitationLevel: number; // 0 is no hesitation, 100 is heavy hesitation
  // New micro-metrics
  breathOnsetVariance: number;
  consonantReleaseDuration: number;
  feedback: string;
  trendAwareSummary: string; // AI feedback considering previous performance
  strengths: string[];
  improvements: string[];
  recommendation: string;
  audioUrl?: string; // URL to user's recording
  audioMimeType?: string; // Correct MIME type for the recording
  modelText?: string; // Original text for model replay
}
