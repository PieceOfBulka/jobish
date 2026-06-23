"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Send, Loader2, Sparkles, Plus, Trash2, MessageSquare, RefreshCw } from "lucide-react";
import { Markdown } from "./Markdown";
import { MarketPanel } from "./MarketPanel";
import type { MarketPanelData } from "@/lib/market";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}
interface Session {
  id: string;
  title: string;
}

const SUGGESTIONS = [
  "Помоги выбрать направление в IT",
  "Какие навыки нужны для моего трека?",
  "Сформулируй мои карьерные цели",
  "Какая зарплата у моей профессии?",
  "Стоит ли мне менять работу?",
];

export function ChatUI({
  initialSessions,
  initialSessionId,
  initialMessages,
}: {
  initialSessions: Session[];
  initialSessionId: string | null;
  initialMessages: Msg[];
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeId, setActiveId] = useState<string | null>(initialSessionId);
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketPanel, setMarketPanel] = useState<MarketPanelData | null>(null);
  const [roadmapUpdated, setRoadmapUpdated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tmpId = useId();
  const seq = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function selectSession(id: string) {
    if (id === activeId) return;
    setActiveId(id);
    setError(null);
    const res = await fetch(`/api/coach?sessionId=${id}`);
    const data = await res.json();
    setMessages(res.ok ? data.messages : []);
  }

  async function newChat() {
    const res = await fetch("/api/coach/sessions", { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setSessions((s) => [{ id: data.id, title: data.title }, ...s]);
      setActiveId(data.id);
      setMessages([]);
    }
  }

  async function deleteChat(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/coach/sessions?id=${id}`, { method: "DELETE" });
    setSessions((s) => s.filter((x) => x.id !== id));
    if (id === activeId) {
      setActiveId(null);
      setMessages([]);
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError(null);
    setInput("");
    const userMsg: Msg = { id: `tmp-${tmpId}-${seq.current++}`, role: "user", content };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: content, sessionId: activeId ?? undefined }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Ошибка");
      return;
    }
    setMessages((m) => [...m, { id: data.reply.id, role: "assistant", content: data.reply.content }]);
    if (data.marketPanel) setMarketPanel(data.marketPanel);
    if (data.roadmapUpdated) setRoadmapUpdated(true);
    // Новая сессия: добавляем в список и делаем активной
    if (!activeId && data.sessionId) {
      setActiveId(data.sessionId);
      setSessions((s) => [{ id: data.sessionId, title: content.slice(0, 40) }, ...s]);
    } else {
      setSessions((s) => s.map((x) => (x.id === activeId && x.title === "Новый диалог" ? { ...x, title: content.slice(0, 40) } : x)));
    }
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      {/* Список чатов */}
      <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-slate-100 bg-white p-2 sm:flex">
        <button onClick={newChat} className="btn-primary mb-2 w-full">
          <Plus className="h-4 w-4" /> Новый диалог
        </button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-slate-400">Пока нет диалогов</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => selectSession(s.id)}
              className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm ${
                s.id === activeId ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{s.title}</span>
              <button onClick={(e) => deleteChat(s.id, e)} className="shrink-0 text-slate-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100" aria-label="Удалить диалог">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Область диалога */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-2 sm:hidden">
          <button onClick={newChat} className="btn-outline flex-1">
            <Plus className="h-4 w-4" /> Новый диалог
          </button>
        </div>

        {roadmapUpdated && (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>Карта развития обновлена по вашему прогрессу.</span>
            <a href="/roadmap" className="inline-flex items-center gap-1 font-medium hover:underline">
              <RefreshCw className="h-3.5 w-3.5" /> Открыть
            </a>
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
                <Sparkles className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">Чем могу помочь?</h2>
              <p className="mt-1 max-w-sm text-sm text-slate-500">
                Я — Jobish AI, ваш карьерный коуч. Спросите о выборе профессии, навыках или целях развития.
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm sm:max-w-[75%] ${
                  m.role === "user" ? "whitespace-pre-wrap bg-brand-600 text-white" : "border border-slate-100 bg-white text-ink"
                }`}
              >
                {m.role === "assistant" ? <Markdown content={m.content} /> : m.content}
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

        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-end gap-2 border-t border-slate-100 bg-canvas pt-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
            placeholder="Напишите сообщение…"
            className="input max-h-32 flex-1 resize-none"
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-primary h-11 px-4">
            <Send className="h-4 w-4" />
          </button>
        </form>

        {marketPanel && (
          <div className="card mt-2 p-4 xl:hidden">
            <p className="text-sm font-semibold text-ink">Аналитика рынка: {marketPanel.title}</p>
            <p className="mt-1 text-xs text-slate-500">
              Junior {marketPanel.salaryJunior.toLocaleString("ru-RU")} ₽ · Middle{" "}
              {marketPanel.salaryMiddle.toLocaleString("ru-RU")} ₽ · Senior{" "}
              {marketPanel.salarySenior.toLocaleString("ru-RU")} ₽
            </p>
          </div>
        )}
      </div>

      {marketPanel && <MarketPanel data={marketPanel} />}
    </div>
  );
}
