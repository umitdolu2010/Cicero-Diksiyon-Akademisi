
import { Difficulty, Exercise, Language } from './types';

export const EXERCISES: Exercise[] = [
  // Turkish - Kulak Eğitimi
  {
    id: 'tr_kulak_1',
    title: 'Ünlü Daralması',
    text: 'Biliyor, demiyor, görmüyor.',
    difficulty: Difficulty.BEGINNER,
    language: Language.TR,
    category: 'Kulak Eğitimi'
  },
  // Turkish - Heceleme & Tekerleme
  {
    id: 'tr_hece_1',
    title: 'Piknikte Papatya',
    text: 'Pireli peynirci, paspasçı porsukla piknikte papatya topladı.',
    difficulty: Difficulty.BEGINNER,
    language: Language.TR,
    category: 'Heceleme & Tekerleme'
  },
  {
    id: 'tr_hece_2',
    title: 'Şemsi Paşa',
    text: 'Şemsi Paşa pasajında sesi büzüşesiceler.',
    difficulty: Difficulty.INTERMEDIATE,
    language: Language.TR,
    category: 'Heceleme & Tekerleme'
  },
  // Turkish - Nefes Kontrolü
  {
    id: 'tr_nefes_1',
    title: 'Uzun Maraton',
    text: 'Eskişehir’den yola çıkan yaşlı adam, çantasındaki taze ekmekleri martılara atmak için sahil boyunca hiç durmadan yürüdü.',
    difficulty: Difficulty.INTERMEDIATE,
    language: Language.TR,
    category: 'Nefes Kontrolü'
  },
  // Turkish - Tonlama & Vurgu
  {
    id: 'tr_ton_1',
    title: 'Soru ve Cevap',
    text: 'Neden hala buradasın? Çünkü beklemem gerektiğini söylediler.',
    difficulty: Difficulty.BEGINNER,
    language: Language.TR,
    category: 'Tonlama & Vurgu'
  },

  // English - Tongue Twisters (Heceleme & Tekerleme)
  {
    id: 'en_hece_1',
    title: 'Peter Piper',
    text: 'Peter Piper picked a peck of pickled peppers.',
    difficulty: Difficulty.BEGINNER,
    language: Language.EN,
    category: 'Heceleme & Tekerleme'
  },
  {
    id: 'en_nefes_1',
    title: 'Long Sentence',
    text: 'The quick brown fox jumps over the lazy dog while the silver moon shines brightly over the silent forest.',
    difficulty: Difficulty.INTERMEDIATE,
    language: Language.EN,
    category: 'Nefes Kontrolü'
  },

  // German - Zungenbrecher
  {
    id: 'de_hece_1',
    title: 'Fischers Fritz',
    text: 'Fischers Fritz fischt frische Fische, frische Fische fischt Fischers Fritz.',
    difficulty: Difficulty.BEGINNER,
    language: Language.DE,
    category: 'Heceleme & Tekerleme'
  }
];

export const COLORS = {
  [Difficulty.BEGINNER]: 'bg-emerald-500',
  [Difficulty.INTERMEDIATE]: 'bg-amber-500',
  [Difficulty.ADVANCED]: 'bg-rose-500',
};

export const MODULES: { id: number, name: string, description: string, icon: string }[] = [
  { id: 1, name: 'Kulak Eğitimi', description: 'Fonetik farkındalık ve sesleri ayırt etme.', icon: '🎧' },
  { id: 2, name: 'Heceleme & Tekerleme', description: 'Artikülasyon ve kas hafızası çalışması.', icon: '👅' },
  { id: 3, name: 'Nefes Kontrolü', description: 'Doğru duraklama ve diyafram kullanımı.', icon: '🫁' },
  { id: 4, name: 'Tonlama & Vurgu', description: 'Duygu aktarımı ve doğru vurgu noktaları.', icon: '🎭' }
];
