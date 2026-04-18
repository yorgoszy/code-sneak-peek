import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Send, Sparkles, Loader2, RotateCcw } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME: Msg = {
  role: "assistant",
  content:
    "Γεια σου! Είμαι ο Hyper AI για τη διοργάνωση. Ρώτα με για αγώνες, ρινγκ, ζυγίσεις, αντιπάλους ή live links 🥊",
};

// Highlight athletes: red corner red, blue corner blue.
// Supports: "A vs B", "A - B", "A | B", emoji 🔴/🔵, labels (Κόκκιν*/Red/Μπλε/Blue),
// optional club tags like [Club], and strips markdown ** markers.
function renderColored(text: string): React.ReactNode {
  const clean = text.replace(/\*\*/g, "");
  const lines = clean.split("\n");
  const L = "A-Za-zΑ-Ωα-ωΆΈΉΊΌΎΏάέήίόύώϊϋΐΰΪΫ";
  const NAME = `[${L}][${L}.\\-']*(?:\\s+[${L}][${L}.\\-']*){0,4}`;
  const SIDE_META = `(\\s*(?:\\[[^\\]]+\\]|\\([^\\)]+\\)))?`;

  return lines.map((line, li) => {
    const segments: { start: number; end: number; node: React.ReactNode }[] = [];
    let key = 0;
    let m: RegExpExecArray | null;

    const pushSeg = (start: number, end: number, node: React.ReactNode) => {
      const overlap = segments.some((s) => !(end <= s.start || start >= s.end));
      if (!overlap) segments.push({ start, end, node });
    };

    const emojiRegex = new RegExp(`(🔴|🔵)\\s*(${NAME})${SIDE_META}`, "gu");
    while ((m = emojiRegex.exec(line)) !== null) {
      const toneClass = m[1] === "🔴" ? "text-competition-red" : "text-competition-blue";
      pushSeg(
        m.index,
        m.index + m[0].length,
        <React.Fragment key={`em-${li}-${key++}`}>
          {m[1]}{" "}
          <span className={`${toneClass} font-semibold`}>{m[2]}</span>
          {m[3] || ""}
        </React.Fragment>
      );
    }

    const labelRegex = new RegExp(
      `(Κόκκιν\\w*[^:\\n]{0,25}?:|Red[^:\\n]{0,25}?:|Μπλε[^:\\n]{0,25}?:|Blue[^:\\n]{0,25}?:)\\s*(${NAME})${SIDE_META}`,
      "giu"
    );
    while ((m = labelRegex.exec(line)) !== null) {
      const toneClass = /κόκκιν|red/i.test(m[1]) ? "text-competition-red" : "text-competition-blue";
      pushSeg(
        m.index,
        m.index + m[0].length,
        <React.Fragment key={`lbl-${li}-${key++}`}>
          {m[1]}{" "}
          <span className={`${toneClass} font-semibold`}>{m[2]}</span>
          {m[3] || ""}
        </React.Fragment>
      );
    }

    const vsRegex = new RegExp(
      `(${NAME})${SIDE_META}\\s*(vs\\.?|VS|κατά|—|–|\\||-)\\s*(🔵|🔴)?\\s*(${NAME})${SIDE_META}`,
      "gu"
    );
    while ((m = vsRegex.exec(line)) !== null) {
      pushSeg(
        m.index,
        m.index + m[0].length,
        <React.Fragment key={`vs-${li}-${key++}`}>
          <span className="text-competition-red font-semibold">{m[1].trim()}</span>
          {m[2] || ""}{" "}
          {m[3] ? `${m[3]} ` : ""}
          <span className="text-competition-blue font-semibold">{m[4].trim()}</span>
          {m[5] || ""}
        </React.Fragment>
      );
    }

    segments.sort((a, b) => a.start - b.start);
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    for (const seg of segments) {
      if (seg.start > lastIndex) parts.push(line.slice(lastIndex, seg.start));
      parts.push(seg.node);
      lastIndex = seg.end;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));

    return (
      <React.Fragment key={`line-${li}`}>
        {parts.length ? parts : line}
        {li < lines.length - 1 && "\n"}
      </React.Fragment>
    );
  });
}

export default function CompetitionAI() {
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get("c") || undefined;

  const storageKey = useMemo(
    () => `hyper_competition_ai_chat::${competitionId || "all"}`,
    [competitionId]
  );

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Msg[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [WELCOME];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {}
  }, [messages, storageKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const resetChat = () => {
    setMessages([WELCOME]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };

      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          requestHeaders.Authorization = `Bearer ${data.session.access_token}`;
        }
      } catch {}

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/competition-public-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({ messages: next, competitionId }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) throw new Error("Πολλά αιτήματα — δοκιμάστε σε λίγο.");
        if (resp.status === 402) throw new Error("Εξαντλήθηκαν τα credits.");
        throw new Error("Σφάλμα σύνδεσης.");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages((p) => [...p, { role: "assistant", content: "" }]);

      const stripLead = (s: string) =>
        s.replace(/\[LEAD_CAPTURE\][\s\S]*?\[\/LEAD_CAPTURE\]/g, "").trim();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              const display = stripLead(assistant);
              setMessages((p) =>
                p.map((m, i) => (i === p.length - 1 ? { ...m, content: display } : m))
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const leadMatch = assistant.match(/\[LEAD_CAPTURE\]([\s\S]*?)\[\/LEAD_CAPTURE\]/);
      if (leadMatch) {
        try {
          const data = JSON.parse(leadMatch[1].trim());
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/competition-public-ai?action=lead`,
            {
              method: "POST",
              headers: requestHeaders,
              body: JSON.stringify({ ...data, competition_id: competitionId }),
            }
          );
        } catch (err) {
          console.error("Lead capture parse failed", err);
        }
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "assistant", content: `⚠️ ${e.message || "Σφάλμα"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col bg-background"
      style={{ height: "100dvh" }}
    >
      <header className="flex-shrink-0 bg-foreground text-background px-4 py-3 flex items-center justify-between border-b border-border z-10">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div>
            <h1 className="text-base font-semibold leading-tight">Hyper AI</h1>
            <p className="text-[11px] opacity-70">Βοηθός Διοργάνωσης</p>
          </div>
        </div>
        <button
          onClick={resetChat}
          className="p-2 hover:bg-background/10 transition-colors"
          aria-label="Reset chat"
          title="Νέα συνομιλία"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </header>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`px-3 py-2 max-w-[85%] rounded-none whitespace-pre-wrap text-sm leading-relaxed border ${
                  m.role === "user"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted text-foreground border-border"
                }`}
              >
                {m.content ? (
                  m.role === "assistant" ? renderColored(m.content) : m.content
                ) : loading && i === messages.length - 1 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  ""
                )}
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="bg-muted border border-border px-3 py-2 flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Σκέφτεται...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        className="flex-shrink-0 border-t border-border bg-background p-3"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())
            }
            placeholder="Ρώτα για αγώνες, ρινγκ, ζυγίσεις…"
            disabled={loading}
            className="rounded-none flex-1"
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-none bg-[#00ffba] hover:bg-[#00ffba]/90 text-black"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
