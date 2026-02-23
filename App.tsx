import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import { useAuthStore } from './store/AuthStore';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Users = lazy(() => import('./pages/Users'));
const AddUser = lazy(() => import('./pages/AddUser'));
const Categories = lazy(() => import('./pages/Categories'));
const Profile = lazy(() => import('./pages/Profile'));
const ItemDetails = lazy(() => import('./pages/ItemDetails'));
const AddItem = lazy(() => import('./pages/AddItem'));

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const flash = (location.state as any)?.flash;

  useEffect(() => {
    if (typeof flash === 'string' && flash.trim()) {
      window.history.replaceState({}, document.title);
    }
  }, [flash]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">
         <header className="md:hidden flex items-center justify-between border-b border-border-light dark:border-border-dark bg-white dark:bg-surface-dark px-4 py-3 sticky top-0 z-20 shadow-sm">
             <div className="flex items-center gap-2">
                 <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1">
                    <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                 </div>
                 <span className="font-bold text-text-main-light dark:text-text-main-dark text-lg">TVDControl</span>
             </div>
             <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-text-sub-light hover:text-primary p-2 -mr-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
                aria-label="Open menu"
             >
                 <span className="material-symbols-outlined">menu</span>
             </button>
         </header>

        {typeof flash === 'string' && flash.trim() && (
          <div className="mx-4 mt-4 md:mx-8 md:mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {flash}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
};

const RequireRole: React.FC<{ children: React.ReactNode; roles: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  const role = user?.role ?? '';
  if (!roles.includes(role)) {
    return <Navigate to="/dashboard" replace state={{ flash: 'Sem permissão para acessar esta área' }} />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
        <Layout>
            <Suspense
              fallback={
                <div className="flex flex-1 items-center justify-center p-6 text-text-sub-light dark:text-text-sub-dark">
                  Carregando...
                </div>
              }
            >
              <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                  <Route path="/inventory" element={<Protected><Inventory /></Protected>} />
                  <Route path="/users" element={<RequireRole roles={['Administrador']}><Users /></RequireRole>} />
                  <Route path="/users/add" element={<RequireRole roles={['Administrador']}><AddUser /></RequireRole>} />
                  <Route path="/categories" element={<RequireRole roles={['Administrador', 'Gerente']}><Categories /></RequireRole>} />
                  <Route path="/profile" element={<Protected><Profile /></Protected>} />
                  <Route path="/item/:id" element={<Protected><ItemDetails /></Protected>} />
                  <Route path="/items/add" element={<RequireRole roles={['Administrador', 'Gerente']}><AddItem /></RequireRole>} />
              </Routes>
            </Suspense>
        </Layout>
    </Router>
  );
};

export default App;
