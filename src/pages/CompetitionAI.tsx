import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

type Msg = { role: "user" | "assistant"; content: string };

export default function CompetitionAI() {
  const [searchParams] = useSearchParams();
  const competitionId = searchParams.get("c") || undefined;
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Γεια σου! Είμαι ο Hyper AI για τη διοργάνωση. Ρώτα με για αγώνες, ρινγκ, ζυγίσεις, αντιπάλους ή live links 🥊",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/competition-public-ai`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], competitionId }),
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
              setMessages((p) => p.map((m, i) => (i === p.length - 1 ? { ...m, content: assistant } : m)));
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "assistant", content: `⚠️ ${e.message || "Σφάλμα"}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-foreground text-background p-4 flex items-center gap-3">
        <Sparkles className="w-6 h-6" />
        <div>
          <h1 className="text-lg font-semibold">Hyper AI</h1>
          <p className="text-xs opacity-80">Βοηθός Διοργάνωσης</p>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <Card
                className={`p-3 max-w-[85%] rounded-none whitespace-pre-wrap text-sm ${
                  m.role === "user" ? "bg-foreground text-background" : "bg-muted"
                }`}
              >
                {m.content || (loading && i === messages.length - 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : "")}
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3 bg-background">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ρώτα για αγώνες, ρινγκ, ζυγίσεις…"
            disabled={loading}
            className="rounded-none"
          />
          <Button onClick={send} disabled={loading || !input.trim()} className="rounded-none">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
