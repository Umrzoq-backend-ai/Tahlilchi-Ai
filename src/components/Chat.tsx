'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Clock, Sparkles } from 'lucide-react';
import { TimestampItem } from '@/types';

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamps?: TimestampItem[];
}

interface ChatProps {
  transcript: string;
  mode: string;
  videoUrl?: string | null;
  onSeek?: (timeStr: string) => void;
}

export default function Chat({ transcript, mode, videoUrl, onSeek }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: "Assalomu alaykum! Men ushbu videoning shaxsiy tahlilchi yordamchisiman. Video bo'yicha istalgan savolingizni bering, aniq daqiqalari bilan javob beraman.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickPrompts = [
    'Ushbu videoning eng asosiy g\'oyasi nima?',
    'Qanday amaliy vazifalar belgilandi?',
    'Spikerlar kimlar va nima haqida gaplashdi?',
    'Xulosa qilib 3 ta eng muhim fikrni ayt',
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input.trim();
    if (!textToSend || loading) return;

    const apiKey = localStorage.getItem('tahlilchi_api_key');
    if (!apiKey) {
      alert('Iltimos, avval Sozlamalarda Gemini API kalitini saqlang.');
      return;
    }

    const model = localStorage.getItem('tahlilchi_model') || 'gemini-2.0-flash';

    const userMsg: ChatMessage = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!questionText) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          message: textToSend,
          transcript,
          mode,
          model_name: model,
          video_url: videoUrl || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Chat javob bermadi');
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.answer || 'Javob olinmadi.',
          timestamps: data.relevant_timestamps || [],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Kechirasiz, savolingizga javob olishda xatolik yuz berdi. API kalit yoki tarmoqni tekshiring.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(\[?\b\d{1,2}:\d{2}(?::\d{2})?\]?)/g);
    return parts.map((part, i) => {
      const cleanMatch = part.match(/\b\d{1,2}:\d{2}(?::\d{2})?\b/);
      if (cleanMatch) {
        const timeStr = cleanMatch[0];
        return (
          <button
            key={i}
            onClick={() => onSeek && onSeek(timeStr)}
            className="timestamp-chip inline-flex items-center gap-1 mx-1 px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono text-xs border border-blue-500/30 hover:bg-blue-500/40"
          >
            <Clock className="w-2.5 h-2.5" />
            <span>{timeStr}</span>
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="glass-card rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Video Bilan Jonli Chat</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </h4>
            <p className="text-[10px] text-slate-400">Kontekst aktiv • Aniq vaqtlar bilan javob beradi</p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-dark-bg/90 border border-slate-800 text-slate-200 rounded-tl-xs'
              }`}
            >
              <div className="whitespace-pre-line">{renderMessageText(m.text)}</div>

              {m.timestamps && m.timestamps.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                  {m.timestamps.map((t, tIdx) => (
                    <button
                      key={tIdx}
                      onClick={() => onSeek && onSeek(t.time)}
                      className="timestamp-chip text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 hover:bg-blue-500/40"
                    >
                      ⏱️ {t.time} ({t.text})
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
            <span>AI javob tayyorlamoqda...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((qp, qIdx) => (
          <button
            key={qIdx}
            disabled={loading}
            onClick={() => handleSend(qp)}
            className="shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-2 border-t border-slate-800"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Video haqida savol bering..."
          disabled={loading}
          className="flex-1 bg-dark-bg border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className={`p-2.5 rounded-xl transition-all ${
            loading || !input.trim()
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
