
import React from 'react';
import { AppState, DifficultyLevel, Article } from '../types';

interface DashboardProps {
  state: AppState;
  onStartReading: (level?: DifficultyLevel) => void;
  onSelectLevel: (level: DifficultyLevel) => void;
  onViewHistory: (article: Article) => void;
  onRemoveHistory: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onStartReading, onSelectLevel, onViewHistory, onRemoveHistory }) => {
  const levels = Object.values(DifficultyLevel);
  const wordsLearned = state.vocabulary.length;
  const articlesRead = state.readHistory.filter(a => a.completed).length;
  const currentLevelIdx = levels.indexOf(state.currentLevel);
  
  const today = new Date().toLocaleDateString();
  const readTodayCount = state.readHistory.filter(a => a.date === today && a.completed).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
            你好，英语探索者
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            今天你想阅读什么难度的文章？建议循序渐进。
          </p>
        </div>
        <div className="bg-indigo-600 px-6 py-4 rounded-3xl text-white shadow-xl shadow-indigo-100 flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs opacity-70 font-bold uppercase tracking-widest">今日阅读进度</p>
            <p className="text-2xl font-black">{readTodayCount} / 2</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
        </div>
      </header>

      {/* 阶段进度条 */}
      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">学习阶段目标</h2>
          <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            终极目标：大学水平 (C1)
          </span>
        </div>
        
        <div className="relative pt-2 pb-10">
          <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
             <div 
               className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-1000"
               style={{ width: `${((currentLevelIdx + 1) / levels.length) * 100}%` }}
             ></div>
          </div>
          <div className="relative flex justify-between">
            {levels.map((level, idx) => (
              <div key={level} className="flex flex-col items-center">
                <div className={`w-5 h-5 rounded-full border-4 transition-all duration-500 ${
                  idx <= currentLevelIdx ? 'bg-white border-indigo-600' : 'bg-white border-gray-200'
                }`}></div>
                <span className={`absolute mt-6 text-[10px] font-bold text-center w-12 sm:w-16 transition-colors ${
                  idx === currentLevelIdx ? 'text-indigo-600 font-black' : 'text-gray-400'
                }`}>
                  {level.split(' - ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:border-indigo-100 transition-all">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">已读完</p>
            <p className="text-3xl font-black text-gray-900">{articlesRead} <span className="text-sm font-bold text-gray-400">篇文章</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-6 group hover:border-indigo-100 transition-all">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-100 transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">生词本</p>
            <p className="text-3xl font-black text-gray-900">{wordsLearned} <span className="text-sm font-bold text-gray-400">个生词</span></p>
          </div>
        </div>
      </div>

      <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/50">
        <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
          选择今日难度
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => onSelectLevel(level)}
              className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all ${
                state.currentLevel === level 
                  ? 'border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-50' 
                  : 'border-gray-50 bg-gray-50/50 hover:bg-white hover:border-gray-200'
              }`}
            >
              <div className="text-left">
                <span className={`block font-black text-sm uppercase tracking-tight ${state.currentLevel === level ? 'text-indigo-700' : 'text-gray-700'}`}>
                  {level.split(' - ')[0]}
                </span>
                <span className="text-[10px] text-gray-400 font-bold">{level.split(' - ')[1] || '入门'}</span>
              </div>
              {state.currentLevel === level && (
                <div className="w-8 h-8 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onStartReading()}
          className="w-full mt-10 py-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-indigo-200 transition-all transform active:scale-[0.97]"
        >
          开始学习
        </button>
      </section>

      {state.readHistory.length > 0 && (
        <section className="pb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-800">学习档案</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">最近 50 篇记录</span>
          </div>
          <div className="space-y-4">
            {state.readHistory.map((article) => (
              <div 
                key={article.id} 
                className={`bg-white p-5 rounded-[2rem] border transition-all flex items-center gap-4 group cursor-pointer ${
                  article.completed ? 'border-green-100 bg-green-50/10' : 'border-gray-100 hover:border-indigo-200'
                }`}
                onClick={() => onViewHistory(article)}
              >
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-sm relative">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                  )}
                  {article.completed && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center backdrop-blur-[1px]">
                      <svg className="w-8 h-8 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow">
                  <h3 className="font-black text-gray-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{article.difficulty.split(' - ')[0]}</span>
                    <span className="text-gray-300 text-xs">•</span>
                    <span className="text-[10px] font-bold text-gray-400">{article.date}</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onRemoveHistory(article.id); }}
                    className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
