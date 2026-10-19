'use client';

import React, { useState } from 'react';
import {
  Send,
  Mail,
  FileText,
  Copy,
  CheckCircle2,
  Sparkles,
  Share2,
  Download,
  Edit3,
} from 'lucide-react';
import { AnalysisResponse } from '@/types';

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface ContentRepurposerProps {
  result: AnalysisResponse;
  videoTitle?: string;
  videoUrl?: string | null;
}

type RepurposeFormat = 'telegram' | 'linkedin' | 'twitter' | 'memo' | 'email';

export default function ContentRepurposer({
  result,
  videoTitle,
  videoUrl,
}: ContentRepurposerProps) {
  const [format, setFormat] = useState<RepurposeFormat>('telegram');
  const [copied, setCopied] = useState(false);
  const [editableText, setEditableText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const title = videoTitle || result.metadata?.title || result.headline || 'Tahliliy Material';
  const author = result.metadata?.author || 'Tahlilchi AI';
  const summary = result.summary || '';
  const facts = result.key_facts || [];
  const decisions = result.key_decisions || [];
  const actions = result.action_items || [];
  const takeaways = facts.length > 0 ? facts : decisions.map((d) => d.decision);

  // Generate content based on selected format
  const generateContent = (fmt: RepurposeFormat): string => {
    const linkText = videoUrl ? `\n\n🔗 Manba: ${videoUrl}` : '';

    if (fmt === 'telegram') {
      let post = `🔥 <b>${title}</b>\n\n`;
      post += `📌 <b>Qisqa xulosa:</b>\n${summary.slice(0, 350)}...\n\n`;
      if (takeaways.length > 0) {
        post += `⚡️ <b>Eng muhim faktlar:</b>\n`;
        takeaways.slice(0, 4).forEach((item) => {
          post += `▫️ ${item}\n`;
        });
        post += `\n`;
      }
      if (actions.length > 0) {
        post += `✅ <b>Asosiy xulosalar:</b>\n`;
        actions.slice(0, 3).forEach((a) => {
          post += `👉 ${a.task}\n`;
        });
        post += `\n`;
      }
      post += `💡 <i>Tahlilchi AI orqali avtomatik tayyorlandi</i>${linkText}\n#tahlil #iqtisodiyot #foydali`;
      return post;
    }

    if (fmt === 'linkedin') {
      let post = `Are you following what's happening with ${title}?\n\n`;
      post += `Here are the 3 biggest takeaways everyone in the industry should know:\n\n`;
      if (takeaways.length > 0) {
        takeaways.slice(0, 3).forEach((item, idx) => {
          post += `${idx + 1}️⃣ ${item}\n\n`;
        });
      } else {
        post += `Key insight:\n${summary}\n\n`;
      }
      post += `💡 The Big Picture:\n${summary.slice(0, 250)}...\n\n`;
      post += `What is your perspective on this? Drop your thoughts below! 👇\n\n`;
      post += `#Leadership #Innovation #IndustryInsights #AI #Analysis${linkText}`;
      return post;
    }

    if (fmt === 'twitter') {
      let thread = `1/4 🧵 Deep dive into "${title}":\n\n${summary.slice(0, 180)}...\n\n👇 Key breakdown:\n\n`;
      if (takeaways[0]) {
        thread += `2/4 📍 Insight #1:\n${takeaways[0].slice(0, 220)}\n\n`;
      }
      if (takeaways[1]) {
        thread += `3/4 📍 Insight #2:\n${takeaways[1].slice(0, 220)}\n\n`;
      }
      thread += `4/4 🎯 Conclusion & Next Steps:\n${
        actions[0]?.task || 'Stay informed and adapt to these fast-moving shifts.'
      }\n\nPowered by @TahlilchiAI${linkText}`;
      return thread;
    }

    if (fmt === 'memo') {
      let memo = `KORPORATIV TAHLILIY MEMORANDUM (EXECUTIVE MEMO)\n`;
      memo += `Kimga: Boshqaruv Kengashi va Rahbariyat\n`;
      memo += `Mavzu: ${title}\n`;
      memo += `Sana: ${new Date().toLocaleDateString('uz-UZ')}\n`;
      memo += `Muallif/Manba: ${author}\n`;
      memo += `--------------------------------------------------\n\n`;
      memo += `1. STRATEGIK XULOSA (EXECUTIVE SUMMARY):\n${summary}\n\n`;
      if (takeaways.length > 0) {
        memo += `2. ASOSIY TAHLILIY FAKTLAR VA RAQAMLAR:\n`;
        takeaways.forEach((t, i) => {
          memo += `   ${i + 1}. ${t}\n`;
        });
        memo += `\n`;
      }
      if (actions.length > 0) {
        memo += `3. TAVSIYA ETILADIGAN HARAKATLAR (ACTION ITEMS):\n`;
        actions.forEach((a, i) => {
          memo += `   - [ ] ${a.task} ${a.assignee ? `(Mas'ul: ${a.assignee})` : ''} ${
            a.deadline ? `(Muddat: ${a.deadline})` : ''
          }\n`;
        });
        memo += `\n`;
      }
      memo += `Hisobot sun'iy intellekt tomonidan video va hujjat tahlili asosida tayyorlandi.`;
      return memo;
    }

    if (fmt === 'email') {
      let email = `Mavzu: Qisqacha Tahlil: ${title}\n\n`;
      email += `Salom jamoa,\n\nUshbu material bo'yicha eng muhim xulosalarni sizlar bilan bo'lishmoqchiman:\n\n`;
      email += `📌 Umumiy mazmun:\n${summary}\n\n`;
      if (takeaways.length > 0) {
        email += `⚡️ Muhim punktlar:\n`;
        takeaways.slice(0, 3).forEach((item) => {
          email += `• ${item}\n`;
        });
        email += `\n`;
      }
      if (actions.length > 0) {
        email += `🎯 Keyingi qadamlar:\n`;
        actions.slice(0, 3).forEach((a) => {
          email += `• ${a.task}\n`;
        });
        email += `\n`;
      }
      email += `Savollar bo'lsa bemalol yozing!\n\nHurmat bilan,\nTahlilchi AI`;
      return email;
    }

    return summary;
  };

  const currentContent = isEditing ? editableText : generateContent(format);

  const handleFormatChange = (newFmt: RepurposeFormat) => {
    setFormat(newFmt);
    setIsEditing(false);
    setEditableText(generateContent(newFmt));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatButtons = [
    { id: 'telegram' as RepurposeFormat, label: 'Telegram Post', icon: Send, color: 'text-sky-400 bg-sky-500/10 border-sky-500/30' },
    { id: 'linkedin' as RepurposeFormat, label: 'LinkedIn Post', icon: LinkedinIcon, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'twitter' as RepurposeFormat, label: 'X / Twitter Thread', icon: TwitterIcon, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    { id: 'memo' as RepurposeFormat, label: 'Executive Memo', icon: FileText, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    { id: 'email' as RepurposeFormat, label: 'Team Email', icon: Mail, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  ];

  return (
    <div className="space-y-4">
      {/* Format Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {formatButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = format === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => handleFormatChange(btn.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30 scale-[1.02]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Editor & Preview Area */}
      <div className="relative rounded-2xl bg-[#070b16] border border-slate-800/90 p-5 space-y-3 shadow-inner">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/70 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">
              {format === 'telegram' && 'Telegram Kanal uchun tayyor formatlangan post'}
              {format === 'linkedin' && 'LinkedIn Professional Ekspert Posti (Viral Hook bilan)'}
              {format === 'twitter' && 'X / Twitter uchun 4 qismli Threadd (Zanjir)'}
              {format === 'memo' && 'Rahbariyat va Investorlar uchun Rasmiy Memorandum'}
              {format === 'email' && 'Jamoaga yuboriladigan qisqa va aniq Email xati'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!isEditing) {
                  setEditableText(currentContent);
                  setIsEditing(true);
                } else {
                  setIsEditing(false);
                }
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? 'Saqlash' : 'Tahrirlash'}</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/40 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Nusxalandi!' : '1-Click Nusxa'}</span>
            </button>
          </div>
        </div>

        {/* Content Box */}
        {isEditing ? (
          <textarea
            value={editableText}
            onChange={(e) => setEditableText(e.target.value)}
            rows={10}
            className="w-full bg-[#050811] text-xs font-mono text-slate-200 p-3.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 leading-relaxed"
          />
        ) : (
          <div className="bg-[#050811]/90 rounded-xl p-4 border border-slate-800/80 max-h-[360px] overflow-y-auto">
            <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed select-all">
              {currentContent}
            </pre>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>{currentContent.length} belgi • {currentContent.split(/\s+/).filter(Boolean).length} so'z</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            ✓ Barcha formatlar biznes standartlariga mos
          </span>
        </div>
      </div>
    </div>
  );
}
