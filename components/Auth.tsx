
import React, { useState } from 'react';
import { AdminUser } from '../types';
import { Logo } from '../constants';

interface AuthProps {
  onSuccess: () => void;
  onBack: () => void;
}

const Auth: React.FC<AuthProps> = ({ onSuccess, onBack }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.sector || !formData.password || !formData.confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }

    const savedAdmins = JSON.parse(localStorage.getItem('latorre_admins') || '[]');
    const userExists = savedAdmins.find((u: AdminUser) => u.name.toLowerCase() === formData.name.toLowerCase());

    if (userExists) {
      setError('Este usuário já existe.');
      return;
    }

    const newUser: AdminUser = {
      name: formData.name,
      sector: formData.sector,
      password: formData.password
    };

    savedAdmins.push(newUser);
    localStorage.setItem('latorre_admins', JSON.stringify(savedAdmins));
    alert('Cadastro realizado com sucesso! Faça login.');
    setTab('login');
    setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const savedAdmins = JSON.parse(localStorage.getItem('latorre_admins') || '[]');
    const user = savedAdmins.find((u: AdminUser) => 
      u.name.toLowerCase() === formData.name.toLowerCase() && u.password === formData.password
    );

    if (user) {
      onSuccess();
    } else {
      setError('Nome ou senha incorretos.');
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-white/20 placeholder:text-white/20 transition-all text-sm";
  const labelClass = "text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block ml-1";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-10 animate-fadeIn">
        <Logo className="w-48 h-36" />
      </div>
      
      <div className="glass-card w-full max-w-md p-8 sm:p-10 rounded-[3rem] border-white/20 animate-slideUp shadow-2xl">
        <div className="flex justify-between items-center mb-10">
          <button 
            onClick={() => setTab('login')}
            className={`flex-1 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${tab === 'login' ? 'border-white text-white' : 'border-white/5 text-white/20'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setTab('register')}
            className={`flex-1 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${tab === 'register' ? 'border-white text-white' : 'border-white/5 text-white/20'}`}
          >
            Cadastre-se
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase text-center animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-6">
          <div>
            <label className={labelClass}>Nome</label>
            <input 
              type="text" 
              className={inputClass} 
              placeholder="Digite seu nome"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className={labelClass}>Setor</label>
              <input 
                type="text" 
                className={inputClass} 
                placeholder="Ex: Governança, Recepção..."
                value={formData.sector}
                onChange={e => setFormData({...formData, sector: e.target.value})}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Senha</label>
            <input 
              type="password" 
              className={inputClass} 
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className={labelClass}>Repita a Senha</label>
              <input 
                type="password" 
                className={inputClass} 
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-5 bg-white text-[#0f172a] rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-sm mt-4"
          >
            {tab === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <button 
          onClick={onBack}
          className="w-full mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white/40 transition-all"
        >
          Voltar para Início
        </button>
      </div>
    </div>
  );
};

export default Auth;
