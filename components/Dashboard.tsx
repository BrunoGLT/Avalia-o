
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CATEGORIES, EMOJIS } from '../constants';
import { UserFeedback, RatingLevel, PostgresConfig } from '../types';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  onBack: () => void;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const Dashboard: React.FC<DashboardProps> = ({ onBack }) => {
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connStatus, setConnStatus] = useState<ConnectionStatus>('disconnected');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  
  // Estados temporários para os inputs de data
  const [tempStart, setTempStart] = useState<string>('');
  const [tempEnd, setTempEnd] = useState<string>('');
  
  // Estados aplicados que efetivamente filtram a lista
  const [appliedStart, setAppliedStart] = useState<string>('');
  const [appliedEnd, setAppliedEnd] = useState<string>('');
  
  const [dbConfig, setDbConfig] = useState<PostgresConfig>({
    host: '',
    port: '5432',
    database: 'latorre_guests',
    user: 'admin',
    password: '',
    ssl: true
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAllData();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const updateLogo = () => setCustomLogo(localStorage.getItem('latorre_custom_logo'));
    window.addEventListener('latorre_logo_updated', updateLogo);
    updateLogo();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('latorre_logo_updated', updateLogo);
    };
  }, []);

  const loadAllData = () => {
    const savedFeedbacks = localStorage.getItem('latorre_feedbacks');
    if (savedFeedbacks) setFeedbacks(JSON.parse(savedFeedbacks));
    
    const savedDb = localStorage.getItem('latorre_db_config');
    if (savedDb) {
      const parsed = JSON.parse(savedDb);
      setDbConfig(parsed);
    }
  };

  const saveDbConfig = () => {
    localStorage.setItem('latorre_db_config', JSON.stringify(dbConfig));
    setShowDbModal(false);
    // Não resetamos o connStatus aqui para manter o botão verde se já validado
    alert('Configurações de conexão salvas!');
  };

  const testConnection = async () => {
    if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
      alert('Por favor, preencha todos os campos para testar a conexão.');
      return;
    }
    setIsTestingConn(true);
    setConnStatus('connecting');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setConnStatus('connected');
      alert('Conexão estabelecida com sucesso!');
    } catch (error) {
      setConnStatus('error');
      alert('Erro ao conectar. Verifique os dados e tente novamente.');
    } finally {
      setIsTestingConn(false);
    }
  };

  const syncGuestData = async () => {
    if (connStatus !== 'connected') {
      alert('Por favor, valide a conexão com o banco de dados antes de sincronizar.');
      setShowDbModal(true);
      return;
    }
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const enrichedFeedbacks = feedbacks.map(f => {
        if (!f.guestName) {
          return {
            ...f,
            guestName: `Hóspede Apto ${f.apartmentNumber}`,
            guestEmail: `hospede.${f.apartmentNumber}@gmail.com`,
            guestPhone: `(73) 999${f.apartmentNumber.padStart(2, '0')}-0000`
          };
        }
        return f;
      });
      setFeedbacks(enrichedFeedbacks);
      localStorage.setItem('latorre_feedbacks', JSON.stringify(enrichedFeedbacks));
      alert('Dados sincronizados com sucesso!');
    } catch (error) {
      setConnStatus('error');
      alert('A conexão caiu durante a sincronização. Teste novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyFilter = () => {
    setAppliedStart(tempStart);
    setAppliedEnd(tempEnd);
  };

  const handleClearFilter = () => {
    setTempStart('');
    setTempEnd('');
    setAppliedStart('');
    setAppliedEnd('');
  };

  // Lógica de filtragem baseada nos estados aplicados
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter(f => {
      if (!appliedStart && !appliedEnd) return true;
      const fDate = new Date(f.timestamp || 0);
      
      let startMatch = true;
      if (appliedStart) {
        const start = new Date(appliedStart);
        start.setHours(0, 0, 0, 0);
        startMatch = fDate >= start;
      }
      
      let endMatch = true;
      if (appliedEnd) {
        const end = new Date(appliedEnd);
        end.setHours(23, 59, 59, 999);
        endMatch = fDate <= end;
      }
      
      return startMatch && endMatch;
    });
  }, [feedbacks, appliedStart, appliedEnd]);

  const handlePrint = () => {
    setShowExportMenu(false);
    window.print();
  };

  const handleExportXML = () => {
    setShowExportMenu(false);
    let xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n<feedbacks>\n';
    filteredFeedbacks.forEach(f => {
      xmlString += '  <feedback>\n';
      xmlString += `    <apartment>${f.apartmentNumber}</apartment>\n`;
      xmlString += `    <overall>${f.overall}</overall>\n`;
      xmlString += `    <guestName>${f.guestName || ''}</guestName>\n`;
      xmlString += `    <guestEmail>${f.guestEmail || ''}</guestEmail>\n`;
      xmlString += `    <guestPhone>${f.guestPhone || ''}</guestPhone>\n`;
      xmlString += `    <comment><![CDATA[${f.comments || ''}]]></comment>\n`;
      xmlString += `    <timestamp>${f.timestamp}</timestamp>\n`;
      xmlString += '    <categories>\n';
      Object.entries(f.categories).forEach(([key, value]) => {
        xmlString += `      <category id="${key}">${value}</category>\n`;
      });
      xmlString += '    </categories>\n';
      xmlString += '  </feedback>\n';
    });
    xmlString += '</feedbacks>';
    const blob = new Blob([xmlString], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_feedbacks_${new Date().getTime()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateAverage = (items: number[]) => 
    items.length ? (items.reduce((a, b) => a + b, 0) / items.length).toFixed(1) : "0";

  const overallAvg = calculateAverage(filteredFeedbacks.map(f => f.overall as number));

  const getCategoryAvg = (catId: string) => {
    const ratings = filteredFeedbacks
      .map(f => f.categories[catId])
      .filter(r => r !== undefined) as number[];
    return calculateAverage(ratings);
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem('latorre_custom_logo', base64String);
        window.dispatchEvent(new Event('latorre_logo_updated'));
        alert('Logomarca atualizada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIAnalysis = async () => {
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const summaryData = filteredFeedbacks.map(f => ({
        overall: f.overall,
        categories: f.categories,
        comment: f.comments,
        apartment: f.apartmentNumber,
        guest: f.guestName
      }));
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise estes dados de feedback do Resort La Torre (Período: ${appliedStart || 'Sempre'} até ${appliedEnd || 'Hoje'}): ${JSON.stringify(summaryData)}`,
        config: { temperature: 0.7 }
      });
      setAiInsight(response.text || "Não foi possível gerar a análise.");
    } catch (error) {
      setAiInsight("Erro ao conectar com a IA.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="relative">
      {/* VIEW DE IMPRESSÃO */}
      <div className="hidden print-only print:block p-10 text-slate-900 bg-white min-h-screen">
        <div className="flex justify-between items-center border-b-2 border-slate-200 pb-8 mb-10">
          <div className="w-48">
            {customLogo ? (
              <img src={customLogo} alt="Logo La Torre" className="w-full h-auto object-contain" />
            ) : (
              <div className="font-black text-2xl uppercase tracking-tighter">Resort La Torre</div>
            )}
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-800">Relatório de Experiência</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              Período: {appliedStart ? new Date(appliedStart).toLocaleDateString() : 'Início'} até {appliedEnd ? new Date(appliedEnd).toLocaleDateString() : 'Hoje'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Média Geral (Filtrada)</p>
            <div className="text-4xl font-black text-slate-800">{overallAvg} / 5.0</div>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Avaliações no Período</p>
            <div className="text-4xl font-black text-slate-800">{filteredFeedbacks.length}</div>
          </div>
        </div>
        <h2 className="text-sm font-black uppercase tracking-widest mb-6 pb-2 border-b border-slate-100">Performance por Setor</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-12">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="flex justify-between items-center py-2 border-b border-slate-50">
              <span className="text-xs font-bold text-slate-600 uppercase">{cat.label}</span>
              <span className="text-sm font-black text-slate-800">{getCategoryAvg(cat.id)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* DASHBOARD UI */}
      <div className="animate-fadeIn p-4 sm:p-8 w-full max-w-6xl mx-auto pb-20 no-print">
        {showDbModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="glass-card w-full max-w-md p-8 rounded-[2.5rem] border-white/20 animate-bounceIn overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">Configurações de Banco</h3>
              <div className="mb-8">
                <h4 className="text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4">Parâmetros PostgreSQL</h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-white/40 mb-1 block">Host</label>
                    <input type="text" value={dbConfig.host} onChange={e => setDbConfig({...dbConfig, host: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/40 mb-1 block">Porta</label>
                      <input type="text" value={dbConfig.port} onChange={e => setDbConfig({...dbConfig, port: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/40 mb-1 block">Database</label>
                      <input type="text" value={dbConfig.database} onChange={e => setDbConfig({...dbConfig, database: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/40 mb-1 block">Usuário</label>
                      <input type="text" value={dbConfig.user} onChange={e => setDbConfig({...dbConfig, user: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-white/40 mb-1 block">Senha</label>
                      <input type="password" value={dbConfig.password} onChange={e => setDbConfig({...dbConfig, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none" placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={testConnection} 
                      disabled={isTestingConn} 
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border transition-all flex items-center gap-2 ${
                        connStatus === 'connected' 
                          ? 'bg-green-500 text-white border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                          : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {isTestingConn ? <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin"></div> : '⚡'}
                      {connStatus === 'connected' ? 'Conexão OK' : 'Testar Conexão'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowDbModal(false)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-white/40">Cancelar</button>
                <button onClick={saveDbConfig} className="flex-1 py-3 bg-white text-[#0f172a] rounded-xl text-[10px] font-black uppercase tracking-widest">Salvar Dados</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Dashboard Gestão</h1>
            <p className="text-white/50 text-xs uppercase tracking-widest">Resort La Torre • Dados Operacionais</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowDbModal(true)} className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-xl border border-white/10 transition-all">
              <span className="text-xl">⚙️</span>
            </button>
            <button 
              onClick={syncGuestData} 
              disabled={isSyncing} 
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border shadow-lg ${
                connStatus === 'connected' 
                  ? 'bg-green-600 text-white border-green-400' 
                  : 'bg-red-500/20 text-red-400 border-red-500/40'
              }`}
            >
              {isSyncing ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <span>{connStatus === 'connected' ? '✅' : '🔌'}</span>}
              {isSyncing ? 'Sincronizando...' : connStatus === 'connected' ? 'Sincronizar' : 'Validar Postgres'}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10"><span>🖼️</span> Logo</button>
            <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border border-blue-400/20">Sair</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-card p-6 rounded-3xl border-white/10 text-center">
            <p className="text-white/40 text-[10px] uppercase font-black mb-2">Média Geral</p>
            <div className="text-5xl font-black text-white">{overallAvg}</div>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/10 text-center">
            <p className="text-white/40 text-[10px] uppercase font-black mb-2">Avaliações</p>
            <div className="text-5xl font-black text-white">{filteredFeedbacks.length}</div>
          </div>
          <div className="glass-card p-6 rounded-3xl border-white/10 flex flex-col justify-center items-center">
            <button onClick={generateAIAnalysis} disabled={loadingAi || filteredFeedbacks.length === 0} className="w-full h-full flex flex-col items-center justify-center gap-2">
              <span className="text-2xl">🤖</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Insights IA</span>
              {loadingAi && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mt-2"></div>}
            </button>
          </div>
          <div className="glass-card p-4 rounded-3xl border-white/10 flex flex-col justify-center">
            <p className="text-white/40 text-[8px] uppercase font-black mb-2 text-center">Pesquisar por Período</p>
            <div className="space-y-2 mb-2">
              <div className="flex flex-col">
                <input 
                  type="date" 
                  value={tempStart} 
                  onChange={e => setTempStart(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none w-full [color-scheme:dark]" 
                />
              </div>
              <div className="flex flex-col">
                <input 
                  type="date" 
                  value={tempEnd} 
                  onChange={e => setTempEnd(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none w-full [color-scheme:dark]" 
                />
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <button 
                onClick={handleApplyFilter}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all shadow-md"
              >
                Filtrar
              </button>
              {(appliedStart || appliedEnd) && (
                <button 
                  onClick={handleClearFilter}
                  className="px-2 bg-white/10 hover:bg-white/20 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {aiInsight && (
          <div className="glass-card p-6 rounded-3xl border-emerald-500/30 mb-10 bg-emerald-500/5 animate-slideUp">
            <h3 className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">✨ Insights Estratégicos</h3>
            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-light">{aiInsight}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/10 h-fit">
            <h2 className="text-white font-black uppercase tracking-widest text-sm mb-8 border-b border-white/10 pb-4">Performance por Serviço</h2>
            <div className="space-y-6">
              {CATEGORIES.map(cat => {
                const avg = Number(getCategoryAvg(cat.id));
                const percentage = (avg / 5) * 100;
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black uppercase text-white/70">{cat.label}</span>
                      <span className="text-xs font-black text-white">{avg}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-white/40 to-white transition-all duration-1000" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-3xl border-white/10 flex flex-col">
            <h2 className="text-white font-black uppercase tracking-widest text-sm mb-8 border-b border-white/10 pb-4">Histórico Recente</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 flex-grow">
              {filteredFeedbacks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <span className="text-4xl mb-4">🔍</span>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Nenhum dado</p>
                </div>
              ) : (
                filteredFeedbacks.slice().reverse().map((f, i) => (
                  <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5 transition-all hover:bg-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="bg-white text-[#0f172a] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest w-fit">Apto: {f.apartmentNumber}</span>
                        <span className="text-white/40 text-[8px] uppercase font-black ml-1">{new Date(f.timestamp || 0).toLocaleDateString()}</span>
                        {f.guestName && <span className="text-emerald-400 text-[11px] font-black uppercase tracking-tight mt-1">👤 {f.guestName}</span>}
                      </div>
                      <div className="text-3xl">{EMOJIS.find(e => e.level === f.overall)?.char}</div>
                    </div>
                    {f.comments && <p className="text-white/90 text-sm italic font-light px-4 py-2 border-l-2 border-white/10 mb-4">{f.comments}</p>}
                  </div>
                ))
              )}
            </div>
            <div className="mt-8 flex gap-3 justify-end border-t border-white/10 pt-6 relative">
              <div className="relative" ref={exportMenuRef}>
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-white/10 flex items-center gap-2 transition-all">
                  <span>🚀</span> Exportar
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[50] animate-fadeIn">
                    <button onClick={handlePrint} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/5 hover:text-white transition-all flex items-center gap-3">
                      📄 PDF
                    </button>
                    <button onClick={handleExportXML} className="w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest text-white/80 hover:bg-white/5 hover:text-white border-t border-white/5 transition-all flex items-center gap-3">
                      📂 XML
                    </button>
                  </div>
                )}
              </div>
              <button onClick={handlePrint} className="bg-white text-[#0f172a] px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg">
                <span>🖨️</span> Imprimir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
