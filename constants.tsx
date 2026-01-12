
import React, { useState, useEffect } from 'react';
import { EvaluationCategory } from './types';

export const COLORS = {
  primary: '#2d3e50',
  accent: '#ffffff',
  background: '#0f172a',
  card: 'rgba(255, 255, 255, 0.05)',
  logoBlue: '#346698',
  logoLightBlue: '#5da0d4'
};

export const CATEGORIES: EvaluationCategory[] = [
  { id: 'apartment', label: 'Apartamento / Conforto', icon: '🏨' },
  { id: 'room_cleaning', label: 'Limpeza do Quarto', icon: '✨' },
  { id: 'wifi', label: 'Qualidade do Wi-Fi', icon: '📶' },
  { id: 'reception', label: 'Recepção / Check-in', icon: '🔑' },
  { id: 'food', label: 'Gastronomia / Bebidas', icon: '🍽️' },
  { id: 'leisure', label: 'Lazer / Piscinas', icon: '🏊' },
  { id: 'staff', label: 'Equipe / Atendimento', icon: '🤝' },
];

export const EMOJIS = [
  { level: 1, char: '😡', label: 'Péssimo' },
  { level: 2, char: '🙁', label: 'Ruim' },
  { level: 3, char: '😐', label: 'Regular' },
  { level: 4, char: '🙂', label: 'Bom' },
  { level: 5, char: '🤩', label: 'Excelente' },
];

export const Logo: React.FC<{ className?: string; onClick?: () => void }> = ({ className = "w-64 h-40", onClick }) => {
  const [logoSrc, setLogoSrc] = useState<string>("logo.png");

  useEffect(() => {
    const updateLogo = () => {
      const customLogo = localStorage.getItem('latorre_custom_logo');
      if (customLogo) {
        setLogoSrc(customLogo);
      } else {
        setLogoSrc("logo.png");
      }
    };
    
    updateLogo();
    
    window.addEventListener('storage', updateLogo);
    window.addEventListener('latorre_logo_updated', updateLogo);
    
    return () => {
      window.removeEventListener('storage', updateLogo);
      window.removeEventListener('latorre_logo_updated', updateLogo);
    };
  }, []);

  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-center transition-transform active:scale-95 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img 
        src={logoSrc} 
        alt="La Torre Resort Logo" 
        className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
        style={{ 
          filter: 'brightness(0) invert(1)',
          WebkitFilter: 'brightness(0) invert(1)' 
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.parentElement) {
            target.parentElement.innerHTML = `
              <div class="flex flex-col items-center opacity-40">
                <div class="w-16 h-16 border-2 border-white rounded-lg flex items-center justify-center mb-2">
                  <span class="text-xs font-black text-white">PNG</span>
                </div>
                <div class="text-white font-black text-center text-[10px] uppercase tracking-widest leading-tight">
                  LOGO<br/>BRANCA
                </div>
              </div>
            `;
          }
        }}
      />
    </div>
  );
};
