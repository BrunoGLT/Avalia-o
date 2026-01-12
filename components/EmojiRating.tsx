
import React from 'react';
import { EMOJIS } from '../constants';
import { RatingLevel } from '../types';

interface EmojiRatingProps {
  value: RatingLevel | null;
  onChange: (level: RatingLevel) => void;
  size?: 'sm' | 'md' | 'lg';
}

const EmojiRating: React.FC<EmojiRatingProps> = ({ value, onChange }) => {
  // Tamanhos ajustados para garantir que caibam em telas menores sem cortar
  const emojiTextSize = 'text-3xl sm:text-5xl md:text-6xl';
  const labelTextSize = 'text-[8px] sm:text-[10px]';

  return (
    <div className="flex justify-between items-center w-full mx-auto py-5 px-1 sm:px-4 bg-white/5 rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-inner overflow-visible">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji.level}
          onClick={() => onChange(emoji.level as RatingLevel)}
          className={`group flex flex-col items-center justify-center transition-all duration-500 transform origin-center focus:outline-none flex-1 min-w-0 ${
            value === emoji.level 
              ? 'opacity-100 scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
              : 'opacity-20 grayscale hover:opacity-60 hover:grayscale-0'
          }`}
        >
          <span className={`${emojiTextSize} mb-1 sm:mb-3 leading-none inline-block transform transition-transform duration-500 select-none`}>
            {emoji.char}
          </span>
          <span className={`${labelTextSize} uppercase tracking-[0.05em] sm:tracking-[0.2em] font-black text-center w-full transition-all duration-500 line-clamp-1 text-white`}>
            {emoji.label}
          </span>
          
          {/* Barra indicadora ativa */}
          <div className={`mt-2 h-1 w-3 sm:w-6 rounded-full transition-all duration-500 ${
            value === emoji.level ? 'bg-white scale-x-100 opacity-100' : 'bg-transparent scale-x-0 opacity-0'
          }`} />
        </button>
      ))}
    </div>
  );
};

export default EmojiRating;
