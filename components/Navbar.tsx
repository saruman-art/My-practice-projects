
import React from 'react';

interface NavbarProps {
  currentView: string;
  setView: (view: 'dashboard' | 'reader' | 'vocab') => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  return (
    <nav className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between h-16">
        <div 
          className="flex items-center gap-2 cursor-pointer" 
          onClick={() => setView('dashboard')}
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">Lumina</span>
        </div>
        
        <div className="flex gap-1">
          <button 
            onClick={() => setView('dashboard')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            首页
          </button>
          <button 
            onClick={() => setView('vocab')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentView === 'vocab' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            生词本
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
