import React, { useState, useRef, useEffect } from 'react';
import { generatePortfolioReply } from '../lib/chatbotFallback';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  content: `سلام! من دستیار هوشمند مهرداد محمودخانلی هستم. 

می‌توانید درباره **نمونه‌کارهای ربات‌های تلگرام**، **اتوماسیون‌های سازمانی با n8n**، **سیستم‌های تحلیل بازارهای مالی**، **وب‌سایت‌های سه‌بعدی** و یا **ثبت سفارش و برآورد پروژه** با من گفتگو کنید.

همچنین به هر سؤال متفرقه دیگری نیز با کمال میل پاسخ می‌دهم!`,
  timestamp: 'اکنون',
};

const SUGGESTED_PROMPTS = [
  'نمونه‌کارهای ربات تلگرام را با آیدی معرفی کن',
  'اتوماسیون با n8n چه کمکی به کسب‌وکار من می‌کند؟',
  'می‌خواهم یک پروژه جدید سفارش دهم',
  'سیستم تحلیل بازارهای مالی چگونه کار می‌کند؟',
];

export const GeminiChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history to /api/chat
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // If only welcome was there, pass current message
      const payload = historyPayload.length > 0 ? historyPayload : [{ role: 'user', content: text }];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: payload }),
      });

      let replyText = '';
      if (res.status === 404 || res.status === 405) {
        // Static hosting (e.g. Cloudflare Pages without Node backend)
        replyText = generatePortfolioReply(text);
      } else if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `خطا در دریافت پاسخ (${res.status})`);
      } else {
        const data = await res.json();
        replyText = data.reply || 'پاسخی دریافت نشد.';
      }

      const botMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        content: replyText,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `متأسفانه در دریافت پاسخ مشکلی رخ داد: ${err.message || 'خطای اتصال به سرور'}. لطفاً دوباره تلاش کنید یا مستقیماً با تلفن 09147960679 تماس بگیرید.`,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  // Convert raw links and markdown bold/bullets to formatted JSX
  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Check for markdown links: [text](url) or raw urls: https://...
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);

      return (
        <p key={idx} className="min-h-[1.2em] mb-1 leading-[1.75]">
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[#aa88ff] underline hover:text-white transition-colors font-mono mx-1 inline-block"
                  dir="ltr"
                >
                  {part.replace('https://t.me/', '@')}
                </a>
              );
            }

            // Bold parsing: **text**
            const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
            return boldParts.map((bp, bIdx) => {
              if (bp.startsWith('**') && bp.endsWith('**')) {
                return (
                  <strong key={bIdx} className="text-white font-semibold">
                    {bp.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={bIdx}>{bp}</span>;
            });
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-5 left-6 z-50 pointer-events-auto select-auto" dir="rtl">
      {/* Minimized Floating Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0a0a0a]/95 border text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-[#aa88ff] cursor-pointer"
          style={{ borderColor: 'var(--accent)' }}
          aria-label="گفتگو با دستیار هوشمند مهرداد"
        >
          <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#aa88ff]/50 bg-black shrink-0">
            <img
              src="/assets/aistudio/file_00000000490081f49e53d6ddd2167a62_fe3bbe49.png"
              alt="دستیار هوشمند"
              className="w-full h-full object-cover object-[center_20%]"
            />
            {hasUnread && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-[#aa88ff] ring-2 ring-black"></span>
            )}
          </div>
          <div className="flex flex-col text-right">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white">
              <span>دستیار هوشمند Gemini</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <span className="text-[10px] text-[#8a8a8a] leading-none mt-0.5">
              مشاوره، نمونه‌کارها و ثبت سفارش
            </span>
          </div>
          <span className="text-[11px] text-[#aa88ff] font-mono mr-1">✦</span>
        </button>
      )}

      {/* Expanded Chat Window */}
      {isOpen && (
        <div
          className="w-[360px] sm:w-[420px] max-w-[94vw] h-[520px] max-h-[82vh] rounded-2xl bg-[#0d0d0d]/98 border shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200"
          style={{ borderColor: 'var(--accent)' }}
        >
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-[#222222] bg-[#141414] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#aa88ff]/60 bg-black shrink-0">
                <img
                  src="/assets/aistudio/file_00000000490081f49e53d6ddd2167a62_fe3bbe49.png"
                  alt="مهرداد محمودخانلی"
                  className="w-full h-full object-cover object-[center_20%]"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-black"></span>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[13px] font-bold text-white">
                    دستیار هوشمند مهرداد
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#aa88ff]/20 text-[#aa88ff] font-mono border border-[#aa88ff]/30">
                    Gemini 3.8
                  </span>
                </div>
                <p className="text-[10.5px] text-[#8a8a8a]">
                  پاسخگوی ربات‌های تلگرام، اتوماسیون و خدمات
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                title="پاکسازی تاریخچه گفتگو"
                className="w-7 h-7 flex items-center justify-center rounded text-[#8a8a8a] hover:text-white hover:bg-[#222222] transition-colors text-[11px]"
              >
                🗑
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="بستن چت"
                className="w-7 h-7 flex items-center justify-center rounded text-[#8a8a8a] hover:text-white hover:bg-[#222222] transition-colors text-[13px]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-[12.5px] no-scrollbar">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] p-3 rounded-xl ${
                    m.role === 'user'
                      ? 'bg-[#aa88ff] text-black font-medium rounded-br-none shadow-md'
                      : 'bg-[#181818] border border-[#262626] text-[#dddddd] rounded-bl-none shadow'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{formatContent(m.content)}</div>
                </div>
                <span className="text-[9.5px] text-[#666666] mt-1 font-mono px-1">
                  {m.timestamp}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start">
                <div className="bg-[#181818] border border-[#262626] p-3 rounded-xl rounded-bl-none flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#aa88ff] animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#aa88ff] animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#aa88ff] animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-[#8a8a8a] mr-2">در حال پاسخگویی...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="px-2.5 py-1 rounded-full bg-[#161616] border border-[#282828] text-[10.5px] text-[#cfcfcf] hover:text-white hover:border-[#aa88ff]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-2.5 px-3 border-t border-[#222222] bg-[#141414] flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="پیام یا سؤال خود را بنویسید..."
              className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[12px] text-white placeholder-[#666666] focus:outline-none focus:border-[#aa88ff] transition-colors"
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="px-3 py-2 rounded-lg bg-[#aa88ff] text-black text-[12px] font-bold hover:bg-white disabled:opacity-40 disabled:hover:bg-[#aa88ff] transition-colors cursor-pointer shrink-0"
              title="ارسال پیام"
            >
              ارسال
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
