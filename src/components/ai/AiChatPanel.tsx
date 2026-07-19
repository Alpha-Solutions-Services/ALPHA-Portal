"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Sparkles } from "lucide-react";
import clsx from "clsx";

type Msg = { role: "user" | "assistant"; content: string };

export function AiChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setError(null);
    setText("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId }),
      });
      const json = (await res.json()) as {
        reply?: string;
        conversationId?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "AI failed");
      if (json.conversationId) setConversationId(json.conversationId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: json.reply || "" },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/80 px-4 py-3">
        <p
          className="flex items-center gap-2 font-semibold text-[var(--color-text)]"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
          Alpha AI Assistant
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted)]">
          Powered by Groq. Not a human — for project questions use Messages to
          reach the team.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-muted)]">
            Ask about your projects, timelines, or how the portal works.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={`${i}-${m.role}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-[var(--color-accent)] text-[#05080f]"
                    : "mr-auto border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
                )}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="px-4 text-xs text-red-400">{error}</p> : null}

      <div className="flex gap-2 border-t border-[var(--color-border)] p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          placeholder="Ask Alpha AI…"
          className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={() => void send()}
          className="rounded-xl bg-[var(--color-accent)] p-2.5 text-[#05080f] disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}
