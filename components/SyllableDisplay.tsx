
import React, { useState, useEffect } from 'react';

interface Props {
  text: string;
  isActive: boolean;
  onComplete?: () => void;
}

export const SyllableDisplay: React.FC<Props> = ({ text, isActive, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  // Basic syllable splitter logic (hyphen based or vowel based approximation)
  const syllables = text.split(/[- ]/);

  useEffect(() => {
    if (!isActive) {
      setCurrentIndex(-1);
      return;
    }

    let index = 0;
    setCurrentIndex(0);
    
    const interval = setInterval(() => {
      index++;
      if (index < syllables.length) {
        setCurrentIndex(index);
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 800); // 800ms per syllable for rhythmic control

    return () => clearInterval(interval);
  }, [isActive, text]);

  return (
    <div className="flex flex-wrap gap-2 justify-center py-6 px-4 bg-slate-900/40 rounded-[2rem] border border-slate-800">
      {syllables.map((syl, i) => (
        <span
          key={i}
          className={`text-3xl font-black transition-all duration-300 px-2 py-1 rounded-xl ${
            i === currentIndex 
              ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-600/40' 
              : i < currentIndex 
                ? 'text-slate-600' 
                : 'text-slate-300'
          }`}
        >
          {syl}
        </span>
      ))}
    </div>
  );
};
