
import React, { useState, useEffect, useCallback } from 'react';
import { DifficultyLevel, Word, Article, AppState } from './types';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Reader from './components/Reader';
import Vocabulary from './components/Vocabulary';
import { generateArticle, generateImage } from './services/gemini';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'reader' | 'vocab'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('lumina_reader_state');
    return saved ? JSON.parse(saved) : {
      currentLevel: DifficultyLevel.KIDS,
      vocabulary: [],
      readHistory: [],
      currentArticle: null
    };
  });

  useEffect(() => {
    localStorage.setItem('lumina_reader_state', JSON.stringify(state));
  }, [state]);

  const handleStartReading = async (level?: DifficultyLevel) => {
    setLoading(true);
    setLoadingMessage('正在为你撰写文章...');
    try {
      const targetLevel = level || state.currentLevel;
      const data = await generateArticle(targetLevel);
      
      setLoadingMessage('正在生成精彩配图...');
      const imageUrl = await generateImage(data.title);
      
      const newArticle: Article = {
        id: Date.now().toString(),
        ...data,
        imageUrl: imageUrl || undefined,
        difficulty: targetLevel,
        date: new Date().toLocaleDateString(),
        completed: false
      };
      
      setState(prev => ({
        ...prev,
        currentArticle: newArticle,
        currentLevel: targetLevel,
        readHistory: [newArticle, ...prev.readHistory].slice(0, 50)
      }));
      setView('reader');
    } catch (error) {
      alert("内容生成失败，请检查网络或 API Key。");
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const handleCompleteArticle = (articleId: string) => {
    setState(prev => ({
      ...prev,
      readHistory: prev.readHistory.map(a => 
        a.id === articleId ? { ...a, completed: true } : a
      ),
      currentArticle: prev.currentArticle?.id === articleId 
        ? { ...prev.currentArticle, completed: true } 
        : prev.currentArticle
    }));
  };

  const handleViewHistoryArticle = (article: Article) => {
    setState(prev => ({
      ...prev,
      currentArticle: article
    }));
    setView('reader');
  };

  const handleAddWord = (word: Word) => {
    setState(prev => ({
      ...prev,
      vocabulary: [word, ...prev.vocabulary.filter(w => w.original !== word.original)]
    }));
  };

  const handleRemoveWord = (wordStr: string) => {
    setState(prev => ({
      ...prev,
      vocabulary: prev.vocabulary.filter(w => w.original !== wordStr)
    }));
  };

  const handleRemoveHistory = (id: string) => {
    setState(prev => ({
      ...prev,
      readHistory: prev.readHistory.filter(a => a.id !== id),
      currentArticle: prev.currentArticle?.id === id ? null : prev.currentArticle
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentView={view} setView={setView} />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {loading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">{loadingMessage}</p>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <Dashboard 
            state={state} 
            onStartReading={handleStartReading} 
            onSelectLevel={(l) => setState(prev => ({...prev, currentLevel: l}))}
            onViewHistory={handleViewHistoryArticle}
            onRemoveHistory={handleRemoveHistory}
          />
        )}

        {view === 'reader' && state.currentArticle && (
          <Reader 
            article={state.currentArticle} 
            vocabulary={state.vocabulary}
            onAddWord={handleAddWord}
            onComplete={handleCompleteArticle}
            onBack={() => setView('dashboard')}
          />
        )}

        {view === 'vocab' && (
          <Vocabulary 
            words={state.vocabulary} 
            onRemoveWord={handleRemoveWord}
            onBackToReader={() => setView('reader')}
            hasActiveArticle={!!state.currentArticle}
          />
        )}
      </main>

      <footer className="py-6 border-t text-center text-gray-400 text-sm">
        Lumina Reader © 2024 • Your Daily English Companion
      </footer>
    </div>
  );
};

export default App;
