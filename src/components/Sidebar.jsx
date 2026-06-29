import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Search, 
  FileSearch, 
  PenTool, 
  Lightbulb,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Panel de control', path: '/', icon: <div className="w-5 h-5 flex items-center justify-center"><Menu className="w-5 h-5" /></div> },
    { name: 'Análisis de keywords', path: '/keywords', icon: <div className="w-5 h-5 flex items-center justify-center"><Search className="w-5 h-5" /></div> },
    { name: 'Auditoría de contenido', path: '/audit', icon: <div className="w-5 h-5 flex items-center justify-center"><FileSearch className="w-5 h-5" /></div> },
    { name: 'Generador de contenido', path: '/generator', icon: <div className="w-5 h-5 flex items-center justify-center"><PenTool className="w-5 h-5" /></div> },
    { name: 'Panel de sugerencias', path: '/suggestions', icon: <div className="w-5 h-5 flex items-center justify-center"><Lightbulb className="w-5 h-5" /></div> },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 w-full h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="font-bold text-xl text-slate-800">SEO Master</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 p-2">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-72 bg-white border-r border-slate-200 h-[100dvh] flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 hidden lg:flex">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="font-bold text-xl text-slate-800 tracking-tight">SEO Master</span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Herramientas</div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                      {item.icon}
                    </div>
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="text-sm font-semibold text-slate-800 mb-1">Plan Pro</div>
            <p className="text-xs text-slate-500 mb-3">Tienes acceso a todas las herramientas avanzadas.</p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <div className="text-xs text-slate-500">45/100 Análisis usados</div>
          </div>
        </div>
      </aside>
    </>
  );
}
