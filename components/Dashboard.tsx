
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
  const articlesRead = state.readHistory.length;

  return (
    <div className="space-y-10 animate-fade-in">
      <header className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Hello, English Explorer!
        </h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          今天你想阅读什么难度的文章？我们建议从基础开始，循序渐进。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">已阅读</p>
            <p className="text-2xl font-bold text-gray-900">{articlesRead} 篇文章</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">词汇积累</p>
            <p className="text-2xl font-bold text-gray-900">{wordsLearned} 个生词</p>
          </div>
        </div>
      </div>

      <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-6">选择当前难度</h2>
        <div className="grid gap-3">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => onSelectLevel(level)}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                state.currentLevel === level 
                  ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`font-semibold ${state.currentLevel === level ? 'text-indigo-700' : 'text-gray-700'}`}>
                {level}
              </span>
              {state.currentLevel === level && (
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onStartReading()}
          className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98]"
        >
          开始今天的阅读
        </button>
      </section>

      {state.readHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">阅读记录</h2>
            <span className="text-sm text-gray-400">最近阅读 {Math.min(articlesRead, 50)} 篇</span>
          </div>
          <div className="grid gap-3">
            {state.readHistory.map((article) => (
              <div key={article.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center group hover:border-indigo-200 transition-colors">
                <div className="flex items-center gap-4 cursor-pointer flex-grow" onClick={() => onViewHistory(article)}>
                  {article.imageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-50 border border-gray-100">
                      <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{article.title}</h3>
                    <p className="text-xs text-gray-400">{article.difficulty} • {article.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onViewHistory(article)}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    重新阅读
                  </button>
                  <button 
                    onClick={() => onRemoveHistory(article.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    title="删除记录"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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
