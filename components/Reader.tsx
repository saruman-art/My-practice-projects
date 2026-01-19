
import React, { useState, useRef } from 'react';
import { Article, Word } from '../types';
import WordModal from './WordModal';
import { generateSpeech, decodeBase64, decodeAudioData } from '../services/gemini';

interface ReaderProps {
  article: Article;
  vocabulary: Word[];
  onAddWord: (word: Word) => void;
}

const Reader: React.FC<ReaderProps> = ({ article, onAddWord }) => {
  const [selectedWord, setSelectedWord] = useState<{ word: string, context: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  const handleWordClick = (word: string, sentence: string) => {
    const cleanWord = word.replace(/[.,!?;:()"]/g, "").trim();
    if (cleanWord.length > 0) {
      setSelectedWord({ word: cleanWord, context: sentence });
    }
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleToggleAudio = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const fullContent = article.paragraphs
        .map(p => p.sentences.map(s => s.en).join(' '))
        .join('\n\n');
        
      const base64Audio = await generateSpeech(fullContent);
      if (!base64Audio) throw new Error("No audio data received");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      const binaryData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(binaryData, ctx, 24000, 1);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
        sourceNodeRef.current = null;
      };

      sourceNodeRef.current = source;
      source.start(0);
      setIsPlaying(true);
    } catch (err) {
      console.error("Audio playback error:", err);
      alert("无法生成朗读音频，请稍后再试。");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-fade-in pb-24">
      <div className="mb-10 text-center relative">
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full mb-3 uppercase tracking-widest">
          {article.difficulty}
        </span>
        
        <div className="flex flex-col items-center gap-4">
          <h1 className="reading-font text-4xl font-bold text-gray-900 leading-tight">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <p className="text-xl text-gray-400 italic font-medium w-full mb-2">
              {article.chineseTitle}
            </p>
            
            <button 
              onClick={handleToggleAudio}
              disabled={isGeneratingAudio}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                isPlaying 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              } ${isGeneratingAudio ? 'opacity-70 cursor-wait' : ''}`}
            >
              {isGeneratingAudio ? (
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent animate-spin rounded-full"></div>
              ) : (
                <svg className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isPlaying ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10v4m6-4v4"></path>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                  )}
                </svg>
              )}
              <span className="text-sm font-bold">
                {isGeneratingAudio ? '生成中...' : isPlaying ? '停止朗读' : '朗读全文'}
              </span>
            </button>

            <button 
              onClick={() => setShowTranslation(!showTranslation)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border ${
                showTranslation 
                ? 'bg-amber-50 text-amber-700 border-amber-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
              </svg>
              <span className="text-sm font-bold">
                {showTranslation ? '隐藏译文' : '中英对照'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {article.imageUrl && (
        <div className="mb-12 rounded-3xl overflow-hidden shadow-xl border border-gray-100 animate-fade-in">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-auto object-cover max-h-[400px]"
          />
        </div>
      )}

      <div className="reading-font text-xl text-gray-800 leading-relaxed space-y-12">
        {article.paragraphs.map((paragraph, pIdx) => (
          <div key={pIdx} className="space-y-4">
            {/* English Paragraph Block */}
            <div className="english-paragraph">
              {paragraph.sentences.map((segment, sIdx) => (
                <span key={sIdx} className="inline mr-1">
                  {segment.en.split(/\s+/).map((word, wIdx) => (
                    <span 
                      key={wIdx}
                      onClick={() => handleWordClick(word, segment.en)}
                      className="hover:bg-yellow-200 cursor-pointer rounded px-0.5 transition-colors duration-200 border-b border-transparent hover:border-yellow-400"
                    >
                      {word}{' '}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            
            {/* Chinese Paragraph Block */}
            {showTranslation && (
              <div className="chinese-paragraph text-gray-500 text-lg font-sans border-l-4 border-indigo-100 pl-6 py-2 bg-indigo-50/20 rounded-r-2xl animate-fade-in leading-relaxed">
                {paragraph.sentences.map(s => s.zh).join('')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-16 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <div>
          <h4 className="font-bold text-blue-900 mb-1">学习小贴士</h4>
          <p className="text-blue-800 text-sm leading-relaxed">
            已经为您切换为<b>“中英对照”</b>模式。现在译文会以段落的形式完整显示在每一段英文正下方，提供更自然、更具连贯性的阅读体验。
          </p>
        </div>
      </div>

      {selectedWord && (
        <WordModal 
          word={selectedWord.word} 
          context={selectedWord.context}
          onClose={() => setSelectedWord(null)}
          onSave={onAddWord}
        />
      )}
    </div>
  );
};

export default Reader;
