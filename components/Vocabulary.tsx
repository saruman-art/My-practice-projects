
import React, { useState } from 'react';
import { Word } from '../types';

interface VocabularyProps {
  words: Word[];
  onRemoveWord: (wordStr: string) => void;
  onBackToReader?: () => void;
  hasActiveArticle?: boolean;
}

const Vocabulary: React.FC<VocabularyProps> = ({ words, onRemoveWord, onBackToReader, hasActiveArticle }) => {
  const [filter, setFilter] = useState('');

  const filteredWords = words.filter(w => 
    w.original.toLowerCase().includes(filter.toLowerCase()) ||
    w.translation.includes(filter)
  );

  return (
    <div className="animate-fade-in space-y-8">
      {hasActiveArticle && onBackToReader && (
        <button 
          onClick={onBackToReader}
          className="group flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors bg-indigo-50 px-4 py-2 rounded-xl mb-2"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          返回正在阅读的文章
        </button>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">生词本</h1>
          <p className="text-gray-500">这里保存了你阅读过程中遇到的所有挑战。</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="搜索单词或翻译..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
          />
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </header>

      {words.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">生词本还是空的</h3>
          <p className="text-gray-500 max-w-xs mx-auto mb-8">开始阅读并在文章中点击你感兴趣的单词，它们会自动出现在这里。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWords.map((word) => (
            <div key={word.original} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 leading-none mb-1">{word.original}</h3>
                  <span className="text-indigo-600 font-mono text-xs">{word.phonetic}</span>
                </div>
                <button 
                  onClick={() => onRemoveWord(word.original)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              <div className="space-y-3">
                <p className="text-lg text-gray-700 font-medium">{word.translation}</p>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <p className="text-sm text-gray-800 italic leading-relaxed font-serif">
                    "{word.example}"
                  </p>
                  <p className="text-xs text-gray-400">
                    {word.exampleTranslation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vocabulary;
