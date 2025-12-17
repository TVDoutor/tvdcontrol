import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ItemDetails from './pages/ItemDetails';
import AddItem from './pages/AddItem';
import Inventory from './pages/Inventory';
import Sidebar from './components/Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Sidebar handles its own responsive visibility via props */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">
         
         {/* Mobile Header */}
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

        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
        <Layout>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/users" element={<Users />} />
                <Route path="/item/:id" element={<ItemDetails />} />
                <Route path="/items/add" element={<AddItem />} />
            </Routes>
        </Layout>
    </Router>
  );
};

export default App;