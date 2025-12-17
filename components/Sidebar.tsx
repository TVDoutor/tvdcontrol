import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  // Check if the current path is related to inventory (list or details), but not "add new"
  const isInventoryActive = location.pathname === '/inventory' || (location.pathname.startsWith('/item/') && location.pathname !== '/items/add');

  const handleProfileClick = () => {
      navigate('/users', { state: { targetUserId: 'admin', editMode: true } });
      if (onClose) onClose();
  };

  const handleLinkClick = () => {
      if (onClose) onClose();
  };

  // Base classes for sidebar container
  const baseClasses = "flex flex-col border-r border-border-light dark:border-border-dark bg-white dark:bg-surface-dark transition-all duration-300 ease-in-out h-full";
  
  // Responsive classes: 
  // - Mobile: Fixed position, z-index high, transform based on isOpen
  // - Desktop: Static position, always visible
  const mobileClasses = `fixed inset-y-0 left-0 z-40 w-64 transform ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'} md:translate-x-0 md:static md:shadow-none`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`${baseClasses} ${mobileClasses}`}>
        <div className="flex flex-col h-full p-4 justify-between">
          <div className="flex flex-col gap-6">
            {/* Brand */}
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-lg bg-primary/10 size-10">
                  <span className="material-symbols-outlined text-primary text-[24px]">inventory_2</span>
                </div>
                <div className="flex flex-col">
                  <h1 className="text-base font-bold leading-none text-text-main-light dark:text-text-main-dark">TVDControl</h1>
                  <p className="text-text-sub-light dark:text-text-sub-dark text-xs mt-1">Admin Dashboard</p>
                </div>
              </div>
              {/* Close button (Mobile only) */}
              <button onClick={onClose} className="md:hidden text-text-sub-light hover:text-primary">
                 <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-2">
              <Link 
                to="/dashboard"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive('/dashboard') 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-text-sub-light dark:text-text-sub-dark hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive('/dashboard') ? 'filled' : ''}`}>dashboard</span>
                <span className="text-sm">Visão Geral</span>
              </Link>

              <Link 
                to="/items/add"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive('/items/add') 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-text-sub-light dark:text-text-sub-dark hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                }`}
              >
                 <span className={`material-symbols-outlined text-[20px] ${isActive('/items/add') ? 'filled' : ''}`}>add_circle</span>
                 <span className="text-sm">Adicionar Item</span>
              </Link>
              
              <Link 
                to="/users"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive('/users') 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-text-sub-light dark:text-text-sub-dark hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive('/users') ? 'filled' : ''}`}>group</span>
                <span className="text-sm">Usuários</span>
              </Link>

              <Link 
                to="/inventory"
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isInventoryActive
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-text-sub-light dark:text-text-sub-dark hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isInventoryActive ? 'filled' : ''}`}>package_2</span>
                <span className="text-sm">Inventário</span>
              </Link>
            </nav>
          </div>

          {/* User Profile Snippet */}
          <button 
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-3 py-3 border-t border-border-light dark:border-border-dark mt-auto w-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group rounded-lg active:scale-95 duration-150"
            title="Ver e editar meu perfil"
          >
            <div 
              className="bg-center bg-no-repeat bg-cover rounded-full size-9 shrink-0 border-2 border-slate-200 dark:border-slate-700 shadow-sm" 
              style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBVaALDdkXZEakGv-aNod9NCb-2GkYppHOzw9oubYd8sdoJNsvv4JM0DHkgBRqOy64FolHrmbTZGX9lEZqT8T9dkS_4I2XnqNYUoVS1PWJeUwM0Uoy7bpZiRa55Uyg4e3mLYg2X3YfCRkBakOiaMCCqjkBhEQFAyNjUYt-pY5j0YnI7GHnVnW9qf4C9tPi6ESIYQoaMufD37bvDhpdeDd11IZQup2XqG9mR2vhdVtNXhJ5CZLtYdlSeYVar1DPILY-ifbocYRtCa5A")'}}
            ></div>
            <div className="flex flex-col min-w-0">
              <p className="text-sm font-semibold truncate text-text-main-light dark:text-text-main-dark group-hover:text-primary transition-colors">Ana Silva</p>
              <div className="flex items-center gap-1 text-xs text-text-sub-light dark:text-text-sub-dark">
                  <span className="truncate">admin@tvdcontrol.com</span>
                  <span 
                      className="material-symbols-outlined text-[14px] ml-auto hover:text-red-500 p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" 
                      title="Logout"
                      onClick={(e) => {
                          e.stopPropagation();
                          navigate('/');
                      }}
                  >
                      logout
                  </span>
              </div>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;