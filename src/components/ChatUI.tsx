"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Помоги выбрать направление в IT",
  "Какие навыки нужны для моего трека?",
  "Сформулируй мои карьерные цели",
  "Стоит ли мне менять работу?",
];

export function ChatUI({ initial, llmEnabled }: { initial: Msg[]; llmEnabled: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    setInput("");
    const userMsg: Msg = { id: `tmp-${Date.now()}`, role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }
    setMessages((m) => [
      ...m,
      { id: data.reply.id, role: "assistant", content: data.reply.content },
    ]);
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-ink">Чем могу помочь?</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Я — Jobish AI, ваш карьерный коуч. Спросите о выборе профессии,
              навыках или целях развития.
            </p>
            <div className="mt-5 grid max-w-lg gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-left text-sm text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm sm:max-w-[75%] ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "border border-slate-100 bg-white text-ink"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Коуч печатает…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-end gap-2 border-t border-slate-100 bg-canvas pt-4"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
          }}
          rows={1}
          placeholder="Напишите сообщение…"
          className="input max-h-32 flex-1 resize-none"
        />
        <button type="submit" disabled={loading || !input.trim()} className="btn-primary h-11 px-4">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {!llmEnabled && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Демо-движок коуча. Подключите OPENROUTER_API_KEY для ответов реальной модели.
        </p>
      )}
    </div>
  );
}
