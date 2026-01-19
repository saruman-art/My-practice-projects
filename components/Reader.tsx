
import React, { useState, useRef, useEffect } from 'react';
import { Article, Word, Paragraph } from '../types';
import WordModal from './WordModal';
import { generateSpeech, decodeBase64, decodeAudioData } from '../services/gemini';

interface ReaderProps {
  article: Article;
  vocabulary: Word[];
  onAddWord: (word: Word) => void;
  onComplete: (id: string) => void;
  onBack: () => void;
}

interface FlatWord {
  id: string;
  pIdx: number;
  sIdx: number;
  wIdx: number;
  word: string;
  startWeight: number;
  endWeight: number;
}

const WORD_BASE = 12;      
const CHAR_BASE = 2.2;     
const COMMA_PAUSE = 25;    
const SENTENCE_PAUSE = 45; 
const PARA_PAUSE = 80;     

const Reader: React.FC<ReaderProps> = ({ article, onAddWord, onComplete, onBack }) => {
  const [selectedWord, setSelectedWord] = useState<{ word: string, context: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingPIdx, setPlayingPIdx] = useState<number | 'all' | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const playbackRef = useRef({
    startTime: 0,
    duration: 0,
    totalWeight: 0,
    flatWords: [] as FlatWord[],
    isActive: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const activeWordElementRef = useRef<HTMLSpanElement | null>(null);

  const calculateWeights = (paragraphs: Paragraph[], startPIdx: number = 0) => {
    const flat: FlatWord[] = [];
    let currentWeight = 0;

    paragraphs.forEach((p, pOffset) => {
      const pIdx = startPIdx + pOffset;
      p.sentences.forEach((s, sIdx) => {
        const words = s.en.trim().split(/\s+/).filter(Boolean);
        words.forEach((w, wIdx) => {
          const startWeight = currentWeight;
          let weight = WORD_BASE + (w.length * CHAR_BASE);
          const cleanWord = w.toLowerCase();
          
          if (wIdx === words.length - 1) {
            weight += SENTENCE_PAUSE;
          } else if (cleanWord.endsWith(',') || cleanWord.endsWith(';') || cleanWord.endsWith(':')) {
            weight += COMMA_PAUSE;
          }

          currentWeight += weight;
          flat.push({
            id: `${pIdx}-${sIdx}-${wIdx}`,
            pIdx, sIdx, wIdx,
            word: w,
            startWeight,
            endWeight: currentWeight
          });
        });
      });
      currentWeight += PARA_PAUSE;
    });

    return { flat, totalWeight: currentWeight };
  };

  useEffect(() => {
    if (activeWordId && activeWordElementRef.current) {
      activeWordElementRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeWordId]);

  const updateLoop = () => {
    const { startTime, duration, totalWeight, flatWords, isActive } = playbackRef.current;
    if (!isActive || !audioContextRef.current) return;

    const elapsed = audioContextRef.current.currentTime - startTime + 0.12;
    
    if (elapsed < duration) {
      const progressRatio = elapsed / duration;
      const targetWeight = progressRatio * totalWeight;
      const currentWord = flatWords.find(fw => targetWeight < fw.endWeight);
      
      if (currentWord && currentWord.id !== activeWordId) {
        setActiveWordId(currentWord.id);
      }
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } else {
      handleStop();
    }
  };

  const handleStop = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current = null;
    }
    cancelAnimationFrame(animationFrameRef.current);
    playbackRef.current.isActive = false;
    setIsPlaying(false);
    setPlayingPIdx(null);
    setActiveWordId(null);
  };

  const handleToggleAudio = async (pIdx: number | 'all' = 'all') => {
    if (isPlaying && playingPIdx === pIdx) {
      handleStop();
      return;
    }

    if (isPlaying) handleStop();

    setIsGeneratingAudio(true);
    setPlayingPIdx(pIdx);

    try {
      let textToRead = "";
      let weights;

      if (pIdx === 'all') {
        textToRead = article.paragraphs
          .map(p => p.sentences.map(s => s.en).join(' '))
          .join('\n\n');
        weights = calculateWeights(article.paragraphs);
      } else {
        const targetP = article.paragraphs[pIdx];
        textToRead = targetP.sentences.map(s => s.en).join(' ');
        weights = calculateWeights([targetP], pIdx);
      }
        
      const base64Audio = await generateSpeech(textToRead);
      if (!base64Audio) throw new Error("Audio fail");

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const binaryData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(binaryData, ctx, 24000, 1);
      
      playbackRef.current.duration = audioBuffer.duration;
      playbackRef.current.startTime = ctx.currentTime;
      playbackRef.current.flatWords = weights.flat;
      playbackRef.current.totalWeight = weights.totalWeight;
      playbackRef.current.isActive = true;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => {
        if (playbackRef.current.isActive) {
          setIsPlaying(false);
          setPlayingPIdx(null);
          setActiveWordId(null);
          playbackRef.current.isActive = false;
        }
      };

      sourceNodeRef.current = source;
      source.start(0);
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } catch (err) {
      console.error(err);
      alert("朗读功能暂时不可用");
      setPlayingPIdx(null);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleWordClick = (word: string, sentence: string) => {
    const cleanWord = word.replace(/[.,!?;:()"]/g, "").trim();
    if (cleanWord.length > 0) {
      setSelectedWord({ word: cleanWord, context: sentence });
    }
  };

  const handleFinish = () => {
    onComplete(article.id);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      onBack();
    }, 2000);
  };

  useEffect(() => {
    return () => handleStop();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-10 animate-fade-in pb-24 relative">
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="text-8xl animate-bounce">🎉</div>
          <div className="absolute inset-0 bg-white/40 backdrop-blur-sm animate-pulse"></div>
        </div>
      )}

      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-500 font-bold hover:text-indigo-600 transition-colors"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          返回仪表盘
        </button>
        {article.completed && (
          <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border border-green-200">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            已研读完成
          </span>
        )}
      </div>

      <div className="mb-12 text-center">
        <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-black rounded-full mb-4 uppercase tracking-[0.2em]">
          {article.difficulty}
        </span>
        <h1 className="reading-font text-4xl md:text-5xl font-black text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>
        <p className="text-2xl text-gray-400 italic font-medium mb-8">
          {article.chineseTitle}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button 
            onClick={() => handleToggleAudio('all')}
            disabled={isGeneratingAudio && playingPIdx === 'all'}
            className={`flex items-center gap-3 px-8 py-3 rounded-2xl transition-all border-2 font-bold shadow-lg ${
              isPlaying && playingPIdx === 'all'
              ? 'bg-red-500 text-white border-red-600 shadow-red-100' 
              : 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-indigo-100'
            } ${isGeneratingAudio && playingPIdx === 'all' ? 'opacity-70 cursor-wait' : 'active:scale-95'}`}
          >
            {isGeneratingAudio && playingPIdx === 'all' ? (
              <div className="w-5 h-5 border-3 border-white border-t-transparent animate-spin rounded-full"></div>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                {isPlaying && playingPIdx === 'all' ? (
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                ) : (
                  <path d="M8 5v14l11-7z"/>
                )}
              </svg>
            )}
            <span>{isGeneratingAudio && playingPIdx === 'all' ? '准备中...' : isPlaying && playingPIdx === 'all' ? '停止播放' : '全文朗读'}</span>
          </button>

          <button 
            onClick={() => setShowTranslation(!showTranslation)}
            className={`flex items-center gap-3 px-8 py-3 rounded-2xl transition-all border-2 font-bold ${
              showTranslation 
              ? 'bg-amber-100 text-amber-800 border-amber-200 shadow-sm' 
              : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 shadow-sm'
            } active:scale-95`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
            </svg>
            <span>{showTranslation ? '隐藏中文' : '中英对照'}</span>
          </button>
        </div>
      </div>

      {article.imageUrl && (
        <div className="mb-16 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white group relative">
          <img 
            src={article.imageUrl} 
            alt={article.title} 
            className="w-full h-auto object-cover max-h-[450px] transition-transform duration-1000 group-hover:scale-105"
          />
        </div>
      )}

      <div className="space-y-16 mb-20">
        {article.paragraphs.map((paragraph, pIdx) => {
          const isThisParagraphPlaying = isPlaying && playingPIdx === pIdx;
          const isThisParagraphLoading = isGeneratingAudio && playingPIdx === pIdx;

          return (
            <div key={pIdx} className="flex flex-col md:flex-row gap-6 group relative">
              <div className="flex-shrink-0 flex md:flex-col items-center gap-3">
                <button
                  onClick={() => handleToggleAudio(pIdx)}
                  disabled={isThisParagraphLoading}
                  className={`
                    w-16 h-16 md:w-20 md:h-20 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all duration-300 shadow-xl border-4
                    ${isThisParagraphPlaying 
                      ? 'bg-indigo-600 text-white border-indigo-400 scale-105 shadow-indigo-200' 
                      : 'bg-white text-indigo-600 border-indigo-50 hover:border-indigo-200 hover:scale-105 shadow-gray-100'}
                  `}
                >
                  {isThisParagraphLoading ? (
                    <div className="w-8 h-8 border-4 border-current border-t-transparent animate-spin rounded-full"></div>
                  ) : isThisParagraphPlaying ? (
                    <>
                      <div className="flex gap-1 items-end h-6 mb-1">
                        <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_0.6s_infinite_0s]"></div>
                        <div className="w-1.5 h-3/5 bg-white rounded-full animate-[bounce_0.6s_infinite_0.2s]"></div>
                        <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_0.6s_infinite_0.4s]"></div>
                      </div>
                    </>
                  ) : (
                    <svg className="w-10 h-10 fill-current ml-1" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  )}
                </button>
              </div>

              <div className="flex-grow space-y-6">
                <div className={`
                  reading-font text-2xl md:text-3xl text-gray-800 leading-[1.8] transition-all duration-500 rounded-[2rem]
                  ${isThisParagraphPlaying ? 'bg-white p-8 md:p-10 shadow-2xl ring-1 ring-indigo-50' : 'md:p-4'}
                `}>
                  {paragraph.sentences.map((segment, sIdx) => (
                    <span key={sIdx} className="inline mr-3">
                      {segment.en.trim().split(/\s+/).filter(Boolean).map((word, wIdx) => {
                        const id = `${pIdx}-${sIdx}-${wIdx}`;
                        const isHighlighted = activeWordId === id;
                        return (
                          <span 
                            key={wIdx}
                            ref={isHighlighted ? activeWordElementRef : null}
                            onClick={() => handleWordClick(word, segment.en)}
                            className={`
                              cursor-pointer rounded-xl px-1.5 transition-all duration-300 inline-block
                              ${isHighlighted 
                                ? 'text-indigo-800 font-black bg-indigo-100 scale-110 shadow-lg ring-2 ring-indigo-400 z-10 relative' 
                                : 'hover:bg-yellow-100 border-b-4 border-transparent hover:border-yellow-400'}
                            `}
                          >
                            {word}
                          </span>
                        );
                      })}{' '}
                    </span>
                  ))}
                </div>
                
                {showTranslation && (
                  <div className={`
                    chinese-paragraph text-gray-400 text-xl font-sans border-l-8 border-indigo-100 pl-8 py-6 bg-indigo-50/20 rounded-r-[2rem] animate-fade-in leading-loose
                  `}>
                    {paragraph.sentences.map(s => s.zh).join('')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 完成阅读按钮 */}
      {!article.completed && (
        <div className="border-t-2 border-gray-100 pt-16 text-center">
          <h3 className="text-2xl font-black text-gray-800 mb-4 uppercase tracking-tight">恭喜！你完成了这段研读</h3>
          <p className="text-gray-400 mb-8 max-w-xs mx-auto">点击下方按钮记录你的学习进度，并获得奖励。</p>
          <button 
            onClick={handleFinish}
            className="px-12 py-5 bg-green-500 hover:bg-green-600 text-white text-xl font-black rounded-3xl shadow-2xl shadow-green-100 transition-all transform active:scale-95 flex items-center gap-3 mx-auto"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
            我读完了！
          </button>
        </div>
      )}

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
