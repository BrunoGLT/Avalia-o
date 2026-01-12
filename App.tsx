
import React, { useState, useEffect, useRef } from 'react';
import { Logo, CATEGORIES } from './constants';
import { RatingLevel, UserFeedback } from './types';
import EmojiRating from './components/EmojiRating';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';

type AppStep = 'welcome' | 'overall' | 'categories' | 'comments' | 'thank-you';
type AppView = 'guest' | 'auth' | 'staff';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('guest');
  const [step, setStep] = useState<AppStep>('welcome');
  const [feedback, setFeedback] = useState<UserFeedback>({
    overall: null,
    categories: {},
    comments: '',
    apartmentNumber: ''
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Efeito para retorno automático após 6 segundos na tela de agradecimento
  useEffect(() => {
    let timer: number;
    if (step === 'thank-you') {
      timer = window.setTimeout(() => {
        handleReset();
      }, 6000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step]);

  const handleNext = () => {
    if (step === 'welcome') setStep('overall');
    else if (step === 'overall') setStep('categories');
    else if (step === 'categories') setStep('comments');
    else if (step === 'comments') {
      saveFeedback();
      setStep('thank-you');
    }
  };

  const handleReset = () => {
    setFeedback({
      overall: null,
      categories: {},
      comments: '',
      apartmentNumber: ''
    });
    setStep('welcome');
  };

  const saveFeedback = () => {
    const newFeedback = { ...feedback, timestamp: Date.now() };
    const saved = localStorage.getItem('latorre_feedbacks');
    const list = saved ? JSON.parse(saved) : [];
    list.push(newFeedback);
    localStorage.setItem('latorre_feedbacks', JSON.stringify(list));
  };

  const updateCategoryRating = (catId: string, level: RatingLevel) => {
    setFeedback(prev => ({
      ...prev,
      categories: { ...prev.categories, [catId]: level }
    }));

    // Lógica de rolagem automática para a próxima categoria
    const currentIndex = CATEGORIES.findIndex(cat => cat.id === catId);
    if (currentIndex < CATEGORIES.length - 1) {
      const nextCategory = CATEGORIES[currentIndex + 1];
      setTimeout(() => {
        const nextElement = document.getElementById(`category-${nextCategory.id}`);
        if (nextElement && scrollContainerRef.current) {
          nextElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150); // Pequeno delay para o feedback visual do clique
    }
  };

  const isCategoryStepComplete = CATEGORIES.every(cat => feedback.categories[cat.id]);
  const isOverallStepComplete = feedback.overall !== null && feedback.apartmentNumber.trim().length > 0;

  const titleClass = "text-2xl sm:text-3xl font-black mb-2 sm:mb-4 text-center uppercase tracking-tight text-white";
  const descClass = "text-white/80 text-sm sm:text-lg text-center mb-6 sm:mb-8 font-light px-2";

  const Background = () => (
    <div className="fixed inset-0 z-0">
      <img 
        src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=2000&auto=format&fit=crop" 
        alt="Praia do Mutá" 
        className="w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-xl"></div>
    </div>
  );

  if (view === 'staff') {
    return (
      <div className="min-h-screen bg-[#0f172a] relative overflow-x-hidden">
        <Background />
        <div className="relative z-10">
          <Dashboard onBack={() => setView('guest')} />
        </div>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#0f172a] relative overflow-x-hidden">
        <Background />
        <div className="relative z-10">
          <Auth 
            onSuccess={() => setView('staff')} 
            onBack={() => setView('guest')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center p-3 sm:p-4 pt-6 sm:pt-10 overflow-x-hidden relative">
      
      <div className="fixed inset-0 z-0 no-print">
        <img 
          src="https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=2000&auto=format&fit=crop" 
          alt="Praia do Mutá" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/95 via-[#0f172a]/80 to-[#0f172a]/95 backdrop-blur-[1.5px]"></div>
      </div>

      <div className="z-20 mb-8 sm:mb-10 animate-fadeIn flex flex-col items-center no-print">
        <Logo 
          onClick={handleReset}
          className={`${step === 'welcome' ? 'w-64 h-44 sm:w-96 sm:h-64' : 'w-40 h-32 sm:w-56 sm:h-40'} transition-all duration-700 ease-in-out`} 
        />
      </div>

      <div className="w-full max-w-2xl z-10 flex-grow flex flex-col no-print">
        
        {step === 'welcome' && (
          <div className="text-center animate-fadeIn flex flex-col items-center justify-start sm:justify-center flex-grow max-w-xl mx-auto pt-6 sm:pt-0">
            <h1 className="text-4xl sm:text-6xl font-black mb-4 sm:mb-6 tracking-tight uppercase text-white">Sua Experiência</h1>
            <p className="text-white/90 mb-8 sm:mb-12 text-lg sm:text-xl font-light leading-relaxed px-4">
              Ajude-nos a manter a excelência. <br/>Sua avaliação leva apenas 1 minuto.
            </p>
            <button 
              onClick={handleNext}
              className="w-full py-5 sm:py-7 bg-white text-[#2d3e50] font-black rounded-2xl sm:rounded-[2rem] shadow-2xl hover:bg-opacity-90 transition-all active:scale-[0.97] text-lg sm:text-2xl uppercase tracking-[0.2em]"
            >
              Iniciar
            </button>
            <button 
              onClick={() => setView('auth')}
              className="mt-12 text-white/20 text-[8px] font-black uppercase tracking-[0.4em] hover:text-white transition-all"
            >
              Acesso Administrativo
            </button>
          </div>
        )}

        {step === 'overall' && (
          <div className="glass-card p-5 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] animate-slideUp shadow-2xl border-white/20">
            <h2 className={titleClass}>Experiência Geral</h2>
            <p className={descClass}>Como você avalia sua estadia conosco?</p>
            
            <div className="mb-8">
              <label className="block text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Número do Apartamento</label>
              <input 
                type="text"
                inputMode="numeric"
                placeholder="Ex: 102"
                className="w-full max-w-[200px] mx-auto block bg-white/10 border border-white/10 rounded-2xl py-4 text-center text-2xl font-black text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/10 transition-all"
                value={feedback.apartmentNumber}
                onChange={(e) => setFeedback(prev => ({ ...prev, apartmentNumber: e.target.value }))}
              />
            </div>

            <div className="my-4 sm:my-8">
              <label className="block text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-4">Sua Satisfação</label>
              <EmojiRating 
                value={feedback.overall}
                onChange={(level) => {
                  setFeedback(prev => ({ ...prev, overall: level }));
                }}
              />
            </div>

            <button 
              disabled={!isOverallStepComplete}
              onClick={handleNext}
              className={`w-full mt-8 sm:mt-12 py-5 sm:py-6 rounded-2xl font-black transition-all text-lg sm:text-xl shadow-2xl uppercase tracking-[0.2em] ${
                isOverallStepComplete 
                ? 'bg-white text-[#2d3e50] active:scale-95 shadow-white/10' 
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
              }`}
            >
              Continuar
            </button>
          </div>
        )}

        {step === 'categories' && (
          <div className="glass-card p-4 sm:p-8 rounded-[2rem] sm:rounded-[3rem] animate-slideUp flex-grow mb-6 shadow-2xl border-white/20 flex flex-col max-h-[72vh] overflow-hidden">
            <div className="text-center mb-4">
              <h2 className={titleClass}>Nossos Serviços</h2>
              <p className="text-white/80 text-[10px] sm:text-xs mt-1 font-black uppercase tracking-[0.2em]">Sua avaliação rola automaticamente para o próximo</p>
            </div>
            
            <div 
              ref={scrollContainerRef}
              className="space-y-10 overflow-y-auto pr-3 sm:pr-4 custom-scrollbar pb-6 flex-grow overflow-x-hidden scroll-smooth"
            >
              {CATEGORIES.map((cat) => (
                <div key={cat.id} id={`category-${cat.id}`} className="animate-fadeIn pt-2">
                  <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xl sm:text-2xl">{cat.icon}</span>
                      <h3 className="text-[10px] sm:text-sm font-black uppercase tracking-[0.1em] text-white">{cat.label}</h3>
                    </div>
                    {feedback.categories[cat.id] && (
                      <span className="text-emerald-400 text-[9px] font-black uppercase tracking-tighter animate-pulse">✓ OK</span>
                    )}
                  </div>
                  <EmojiRating 
                    value={feedback.categories[cat.id] || null}
                    onChange={(level) => updateCategoryRating(cat.id, level)}
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 mt-auto border-t border-white/10 flex justify-center">
              <button 
                disabled={!isCategoryStepComplete}
                onClick={handleNext}
                className={`w-full max-w-sm py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black transition-all text-base sm:text-lg shadow-2xl uppercase tracking-[0.2em] ${
                  isCategoryStepComplete 
                  ? 'bg-white text-[#2d3e50] active:scale-95 shadow-white/10' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                }`}
              >
                Próximo Passo
              </button>
            </div>
          </div>
        )}

        {step === 'comments' && (
          <div className="glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3.5rem] animate-slideUp shadow-2xl border-white/20">
            <h2 className={titleClass}>Deseja dizer mais?</h2>
            <p className={descClass}>Suas observações ajudam a moldar o futuro do resort.</p>
            
            <textarea
              className="w-full bg-white/10 border border-white/10 rounded-2xl p-5 sm:p-8 text-white focus:outline-none focus:ring-2 focus:ring-white/20 min-h-[150px] sm:min-h-[220px] resize-none text-base sm:text-xl font-light leading-relaxed placeholder:text-white/20"
              placeholder="Escreva aqui seus comentários..."
              value={feedback.comments}
              onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
            />

            <button 
              onClick={handleNext}
              className="w-full mt-6 sm:mt-10 py-5 sm:py-7 bg-white text-[#2d3e50] font-black rounded-2xl shadow-2xl transition-all hover:bg-opacity-90 active:scale-95 text-lg sm:text-2xl uppercase tracking-[0.2em]"
            >
              Finalizar
            </button>
          </div>
        )}

        {step === 'thank-you' && (
          <div className="text-center animate-bounceIn flex flex-col items-center justify-center flex-grow">
            <div className="flex justify-center mb-8 sm:mb-12">
              <div className="w-28 h-28 sm:w-40 sm:h-40 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
                <svg className="w-14 h-14 sm:w-20 sm:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl sm:text-6xl font-black mb-4 sm:mb-8 tracking-tight uppercase text-white">Obrigado!</h1>
            <p className="text-white/90 mb-4 sm:mb-8 text-base sm:text-2xl font-light leading-relaxed max-w-md mx-auto px-4">
              Sua avaliação foi enviada. <br/>Bahia te espera sempre!
            </p>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest animate-pulse mb-8 sm:mb-16">
              Retornando à tela inicial em alguns instantes...
            </p>
            <button 
              onClick={handleReset}
              className="px-10 py-4 bg-white/10 text-white font-black rounded-full border border-white/10 hover:bg-white/20 transition-all active:scale-95 uppercase tracking-[0.2em] text-[10px] sm:text-xs"
            >
              Nova Avaliação
            </button>
          </div>
        )}

      </div>

      <footer className="mt-6 sm:mt-12 mb-4 z-10 text-white/40 text-[7px] sm:text-[10px] uppercase tracking-[0.3em] font-black text-center no-print">
        © {new Date().getFullYear()} Resort La Torre • Porto Seguro • Bahia
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.02); } 100% { transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-bounceIn { animation: bounceIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Print Styles */
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .glass-card { 
            background: white !important; 
            backdrop-filter: none !important; 
            border: 1px solid #eee !important;
            color: black !important;
            box-shadow: none !important;
          }
          .text-white { color: black !important; }
          .text-white\/40, .text-white\/50, .text-white\/80 { color: #666 !important; }
          .bg-white\/5 { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
          .print-card { 
            break-inside: avoid; 
            margin-bottom: 20px !important;
            border: 1px solid #ccc !important;
            padding: 15px !important;
          }
        }
      `}} />
    </div>
  );
};

export default App;
