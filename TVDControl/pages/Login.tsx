import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation States
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
      if (emailError) setEmailError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Email Format
    if (!validateEmail(email)) {
        setEmailError('Por favor, insira um endereço de email válido.');
        return;
    }

    setIsLoading(true);
    
    if (activeTab === 'register' && password !== confirmPassword) {
        alert("As senhas não coincidem!");
        setIsLoading(false);
        return;
    }
    
    // Simulate API call for both Login and Register
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, you would handle registration logic here
      navigate('/dashboard');
    }, 800);
  };

  const toggleTab = (tab: 'login' | 'register') => {
      setActiveTab(tab);
      setEmailError('');
      // Optional: Clear form or keep values
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Minimal Top Nav */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7edf3] dark:border-slate-800 bg-white dark:bg-[#101922] px-6 lg:px-10 py-3 z-20">
        <div className="flex items-center gap-4 text-[#0d141b] dark:text-white">
          <div className="size-8 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">inventory_2</span>
          </div>
          <h2 className="text-[#0d141b] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">TVDControl</h2>
        </div>
        <div className="flex gap-4">
          <a className="hidden sm:flex text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary items-center gap-2" href="#">
            <span className="material-symbols-outlined text-[18px]">help</span>
            Help Center
          </a>
        </div>
      </header>

      {/* Main Layout Split */}
      <main className="flex-1 flex flex-row h-full">
        {/* Left Side: Visual / Branding (Visible on Desktop) */}
        <div className="hidden lg:flex w-1/2 relative bg-slate-900 flex-col justify-end p-12 overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img 
              alt="Modern warehouse" 
              className="w-full h-full object-cover opacity-60" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdAS5ROLfwWM3YM7Z7fyDh1y_LZzzLMx-iPtdYaUTtkMdcyAMCTgBfzP44BgbIsq1I9JQBECElRaNZhMgbZHsZBcz1_4aY9sTkbv46BhEZQMSd6QJX6oDbJpgIBHjp8oXejfTMUdgsPrLjrYgzhW28LZ4XFpq5PadC6ARr8Q6E2A4xkHvN-wJ997G1OhGvdifsw9g39RB0RNCF4LtCGhQ8eUVszOXiKdu_vuLwA9UOJGQWEYu4xoCbGxXlsLEphF_C9qczo1LqysM"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          </div>
          
          {/* Content Overlay */}
          <div className="relative z-10 max-w-xl mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">Case Study</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4 leading-tight">
              "Se quer ir rápido, vá sozinho. Se quer ir longe, vá em grupo, vá acompanhado."
            </h1>
            <div className="flex items-center gap-4 mt-6">
              <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border-2 border-primary">
                <img 
                    alt="Hildebrando Cardoso" 
                    className="w-full h-full object-cover" 
                    src="https://lh3.googleusercontent.com/a/ACg8ocJmH1eoI0nuJgR9jHY7WBzvR1-j6LAU5qwHR1iffZFZLdUNu0A5jHQsKfnkp6Dst9yHfQCAhCk6IsiGcWsQBnfyMhIWUcPK=s360-c-no"
                />
              </div>
              <div>
                <p className="text-white font-semibold">Hildebrando Cardoso</p>
                <p className="text-slate-300 text-sm">Head de ti, TV Doutor.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 overflow-y-auto bg-background-light dark:bg-background-dark">
          <div className="w-full max-w-[440px] flex flex-col gap-8">
            {/* Header Text */}
            <div className="flex flex-col gap-2 text-center lg:text-left">
              <h2 className="text-[#0d141b] dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em]">
                  {activeTab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </h2>
              <p className="text-[#4c739a] dark:text-slate-400 text-base font-normal">
                  {activeTab === 'login' 
                    ? 'Entre com suas credenciais para acessar o sistema.' 
                    : 'Preencha os dados abaixo para começar.'}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-[#cfdbe7] dark:border-slate-700">
              <div className="flex w-full">
                <button 
                    onClick={() => toggleTab('login')}
                    className={`flex-1 flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-colors ${
                        activeTab === 'login' 
                        ? 'border-b-primary text-[#0d141b] dark:text-white' 
                        : 'border-b-transparent text-[#4c739a] dark:text-slate-500 hover:text-[#0d141b] dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Log In</p>
                </button>
                <button 
                    onClick={() => toggleTab('register')}
                    className={`flex-1 flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 transition-colors ${
                        activeTab === 'register' 
                        ? 'border-b-primary text-[#0d141b] dark:text-white' 
                        : 'border-b-transparent text-[#4c739a] dark:text-slate-500 hover:text-[#0d141b] dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <p className="text-sm font-bold leading-normal tracking-[0.015em]">Cadastro</p>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Name Field (Register Only) */}
              {activeTab === 'register' && (
                  <div className="flex flex-col gap-1.5 animate-in slide-in-from-left-2 duration-300">
                    <label className="text-[#0d141b] dark:text-slate-200 text-sm font-medium leading-normal" htmlFor="name">Nome Completo</label>
                    <div className="flex w-full items-stretch rounded-lg h-12 bg-[#e7edf3] dark:bg-slate-800 group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 dark:focus-within:ring-offset-slate-900 transition-all">
                      <div className="text-[#4c739a] dark:text-slate-400 flex items-center justify-center pl-4 pr-2">
                        <span className="material-symbols-outlined text-[20px]">person</span>
                      </div>
                      <input 
                        type="text" 
                        id="name" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome" 
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg bg-transparent text-[#0d141b] dark:text-white placeholder:text-[#4c739a] dark:placeholder:text-slate-500 focus:outline-0 border-none h-full text-sm font-normal px-2"
                      />
                    </div>
                  </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[#0d141b] dark:text-slate-200 text-sm font-medium leading-normal" htmlFor="email">Endereço de Email</label>
                <div className={`flex w-full items-stretch rounded-lg h-12 transition-all ${emailError ? 'bg-red-50 dark:bg-red-900/10 ring-2 ring-red-500' : 'bg-[#e7edf3] dark:bg-slate-800 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 dark:focus-within:ring-offset-slate-900'}`}>
                  <div className={`flex items-center justify-center pl-4 pr-2 ${emailError ? 'text-red-500' : 'text-[#4c739a] dark:text-slate-400'}`}>
                    <span className="material-symbols-outlined text-[20px]">{emailError ? 'error' : 'mail'}</span>
                  </div>
                  <input 
                    type="email" 
                    id="email" 
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="nome@tvdoutor.com.br" 
                    className={`flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg bg-transparent placeholder:text-[#4c739a] dark:placeholder:text-slate-500 focus:outline-0 border-none h-full text-sm font-normal px-2 ${emailError ? 'text-red-900 dark:text-red-200' : 'text-[#0d141b] dark:text-white'}`}
                  />
                </div>
                {emailError && (
                    <span className="text-red-500 text-xs font-medium animate-in slide-in-from-top-1">{emailError}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[#0d141b] dark:text-slate-200 text-sm font-medium leading-normal" htmlFor="password">Senha</label>
                  {activeTab === 'login' && (
                    <a href="#" className="text-primary text-xs font-semibold hover:underline">Esqueceu a senha?</a>
                  )}
                </div>
                <div className="flex w-full items-stretch rounded-lg h-12 bg-[#e7edf3] dark:bg-slate-800 group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 dark:focus-within:ring-offset-slate-900 transition-all">
                  <div className="text-[#4c739a] dark:text-slate-400 flex items-center justify-center pl-4 pr-2">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <input 
                    type="password" 
                    id="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={activeTab === 'register' ? "Crie uma senha forte" : "Digite sua senha"} 
                    className="flex w-full min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-[#0d141b] dark:text-white placeholder:text-[#4c739a] dark:placeholder:text-slate-500 focus:outline-0 border-none h-full text-sm font-normal px-2"
                  />
                  <button type="button" className="text-[#4c739a] dark:text-slate-400 hover:text-primary dark:hover:text-primary flex items-center justify-center px-4 rounded-r-lg">
                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                </div>
              </div>

              {/* Confirm Password Field (Register Only) */}
              {activeTab === 'register' && (
                  <div className="flex flex-col gap-1.5 animate-in slide-in-from-left-2 duration-300 delay-75">
                    <label className="text-[#0d141b] dark:text-slate-200 text-sm font-medium leading-normal" htmlFor="confirm-password">Confirme sua senha</label>
                    <div className="flex w-full items-stretch rounded-lg h-12 bg-[#e7edf3] dark:bg-slate-800 group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1 dark:focus-within:ring-offset-slate-900 transition-all">
                      <div className="text-[#4c739a] dark:text-slate-400 flex items-center justify-center pl-4 pr-2">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </div>
                      <input 
                        type="password" 
                        id="confirm-password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme sua senha" 
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden bg-transparent text-[#0d141b] dark:text-white placeholder:text-[#4c739a] dark:placeholder:text-slate-500 focus:outline-0 border-none h-full text-sm font-normal px-2"
                      />
                    </div>
                  </div>
              )}

              {activeTab === 'login' && (
                <div className="flex items-center gap-3 py-1">
                    <div className="flex items-center h-5">
                    <input 
                        id="remember" 
                        type="checkbox" 
                        className="w-4 h-4 border-slate-300 rounded bg-slate-50 focus:ring-3 focus:ring-primary/30 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-primary/60 dark:ring-offset-slate-800 text-primary"
                    />
                    </div>
                    <label htmlFor="remember" className="text-sm font-medium text-slate-700 dark:text-slate-300">Lembrar me por 30 dias</label>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-primary hover:bg-blue-600 text-slate-50 text-base font-bold leading-normal tracking-[0.015em] transition-colors shadow-sm shadow-blue-500/30 disabled:opacity-70"
              >
                <span className="truncate">
                    {isLoading 
                        ? (activeTab === 'login' ? 'Entrando...' : 'Criando conta...') 
                        : (activeTab === 'login' ? 'Entrar' : 'Cadastrar')
                    }
                </span>
              </button>
            </form>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase">Ou continue com</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-10 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    <span className="text-sm font-semibold text-[#0d141b] dark:text-white">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-10 px-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <img src="https://www.svgrepo.com/show/452263/microsoft.svg" alt="Microsoft" className="w-5 h-5" />
                    <span className="text-sm font-semibold text-[#0d141b] dark:text-white">Microsoft</span>
                </button>
            </div>
            
            <p className="text-center text-sm text-[#4c739a] dark:text-slate-400">
                {activeTab === 'login' ? "Não possui uma conta?" : "Já possui uma conta?"}
                <button 
                    onClick={() => toggleTab(activeTab === 'login' ? 'register' : 'login')}
                    className="text-primary font-bold hover:underline ml-1 cursor-pointer"
                >
                    {activeTab === 'login' ? "Inscreva-se gratuitamente" : "Fazer Login"}
                </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;