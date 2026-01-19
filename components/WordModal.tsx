
import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../types';
import { explainWord, generateSpeech, decodeBase64, decodeAudioData } from '../services/gemini';

interface WordModalProps {
  word: string;
  context: string;
  onClose: () => void;
  onSave: (word: Word) => void;
}

const WordModal: React.FC<WordModalProps> = ({ word, context, onClose, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<{ phonetic: string, translation: string, example: string, exampleTranslation: string } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchExplanation = async () => {
      setLoading(true);
      try {
        const data = await explainWord(word, context);
        if (mounted) {
          setExplanation(data);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          alert("无法加载单词定义。");
          onClose();
        }
      }
    };
    fetchExplanation();
    return () => { mounted = false; };
  }, [word, context, onClose]);

  const handleSpeech = async () => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      const base64Audio = await generateSpeech(word);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const binaryData = decodeBase64(base64Audio);
        const audioBuffer = await decodeAudioData(binaryData, ctx, 24000, 1);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start(0);
      } else {
        // Fallback to browser synth if API fails
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
      setIsSpeaking(false);
    }
  };

  const handleSave = () => {
    if (explanation) {
      onSave({
        original: word,
        ...explanation,
        timestamp: Date.now(),
        mastered: false
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-scale-up">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <p className="text-gray-500 font-medium">正在查询 "{word}"...</p>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-1">{word}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-600 font-mono text-sm">{explanation?.phonetic}</span>
                  <button 
                    onClick={handleSpeech}
                    disabled={isSpeaking}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                  >
                    <svg className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                  </button>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">中文释义</h3>
                <p className="text-lg text-gray-800 font-medium">{explanation?.translation}</p>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">学习例句</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <p className="text-gray-800 italic leading-relaxed text-sm">"{explanation?.example}"</p>
                  <p className="text-gray-400 text-xs">{explanation?.exampleTranslation}</p>
                </div>
              </section>
            </div>

            <button 
              onClick={handleSave}
              className="w-full mt-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              加入生词本
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WordModal;
