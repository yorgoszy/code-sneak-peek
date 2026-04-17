import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

interface LandingChatbotProps {
  language?: 'el' | 'en';
}

const STORAGE_KEY = 'hyper_landing_chat';

const getOrCreateSessionId = (): string => {
  try {
    const existing = localStorage.getItem('hyper_landing_chat_session');
    if (existing) return existing;
    const id = `web_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('hyper_landing_chat_session', id);
    return id;
  } catch {
    return `web_${Date.now()}`;
  }
};

const WELCOME_EL =
  'Γεια σου! 👋 Είμαι ο **RidAI**. Μπορώ να σε βοηθήσω να βρεις το ιδανικό πρόγραμμα — Hyperkids, Hypergym, Hyperathletes ή Elite Training. Πες μου, τι ψάχνεις;';
const WELCOME_EN =
  "Hi! 👋 I'm **RidAI**. I can help you find the perfect program — Hyperkids, Hypergym, Hyperathletes or Elite Training. What are you looking for?";

const PLACEHOLDER_EL = 'Γράψε το μήνυμά σου...';
const PLACEHOLDER_EN = 'Type your message...';

const LandingChatbot: React.FC<LandingChatbotProps> = ({ language = 'el' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch {}
    setMessages([
      { role: 'assistant', content: language === 'en' ? WELCOME_EN : WELCOME_EL },
    ]);
  }, [language]);

  // Persist history
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/landing-ai-sales`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: nextMessages,
          sessionId,
          language,
          userAgent: navigator.userAgent,
        }),
        signal: ctrl.signal,
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          throw new Error(
            language === 'en'
              ? 'Too many requests, try again shortly.'
              : 'Πολλά αιτήματα, δοκιμάστε ξανά σε λίγο.'
          );
        }
        if (resp.status === 402) {
          throw new Error(
            language === 'en'
              ? 'AI credits exhausted.'
              : 'Τα credits του AI εξαντλήθηκαν.'
          );
        }
        throw new Error('Network error');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantSoFar = '';
      let streamDone = false;
      let createdAssistant = false;

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          if (!createdAssistant) {
            createdAssistant = true;
            return [...prev, { role: 'assistant', content: assistantSoFar }];
          }
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {}
        }
      }
    } catch (err: any) {
      const errMsg =
        err?.message ||
        (language === 'en' ? 'Something went wrong.' : 'Κάτι πήγε στραβά.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, messages, sessionId, language]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const placeholder = language === 'en' ? PLACEHOLDER_EN : PLACEHOLDER_EL;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={language === 'en' ? 'Open chat' : 'Άνοιγμα συνομιλίας'}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 bg-black text-white pl-4 pr-5 py-3 shadow-2xl hover:bg-[#00ffba] hover:text-black transition-all duration-300"
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00ffba] rounded-full animate-pulse group-hover:bg-black" />
          </div>
          <span className="text-sm font-semibold hidden sm:inline">
            {language === 'en' ? 'Hyper Coach AI' : 'Hyper Coach AI'}
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[calc(100vh-3rem)] bg-white shadow-2xl border border-gray-200 flex flex-col font-robert">
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#00ffba] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Hyper Coach AI</p>
                <p className="text-[11px] text-gray-300 leading-tight">
                  {language === 'en' ? 'Online · Powered by GPT-5' : 'Online · Με GPT-5'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-strong:text-black">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'en' ? 'Thinking...' : 'Σκέφτεται...'}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              className="rounded-none resize-none min-h-[40px] max-h-[100px] text-sm"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black h-10 px-3"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingChatbot;
