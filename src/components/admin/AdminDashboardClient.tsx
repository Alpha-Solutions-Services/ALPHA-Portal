"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  BarChart3,
  Inbox,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const WhatsAppChat = dynamic(
  () =>
    import("@/components/chat/WhatsAppChat").then((m) => m.WhatsAppChat),
  { ssr: false }
);

type Stats = {
  inquiriesTotal: number;
  inquiriesNew: number;
  activeClientThreads: number;
  unreadClientMessages: number;
  messagesLast7Days: number;
  pageViewsLast7Days: number;
};

type Inquiry = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  budget: string | null;
  service_slug: string;
  message: string;
  status: string;
  admin_notes: string | null;
};

type ThreadRow = {
  id: string;
  client_user_id: string;
  client_email: string | null;
  updated_at: string;
  messageCount: number;
  unread: number;
  lastMessage: { body: string; created_at: string; is_admin: boolean } | null;
};

const tabs = [
  { id: "overview" as const, label: "Overview", icon: BarChart3 },
  { id: "inquiries" as const, label: "Inquiries", icon: Inbox },
  { id: "clients" as const, label: "Clients & chat", icon: MessageSquare },
];

export function AdminDashboardClient() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<string | null>(null);
  const [assistPreview, setAssistPreview] = useState("");
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "inquiries" || t === "clients" || t === "overview") setTab(t);
  }, [searchParams]);

  const refresh = useCallback(async () => {
    setBusy(true);
    setLoadErr(null);
    try {
      const [sRes, iRes, tRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/inquiries"),
        fetch("/api/admin/threads"),
      ]);
      if (!sRes.ok) throw new Error("Stats failed");
      setStats((await sRes.json()) as Stats);
      if (iRes.ok) {
        const ij = (await iRes.json()) as { inquiries?: Inquiry[] };
        setInquiries(ij.inquiries ?? []);
      }
      if (tRes.ok) {
        const tj = (await tRes.json()) as { threads?: ThreadRow[] };
        setThreads(tj.threads ?? []);
      }
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function patchInquiry(id: string, status: Inquiry["status"]) {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    void refresh();
  }

  async function onComposeAssist(action: "draft" | "summarize" | "next") {
    if (!selectedThread) return;
    const res = await fetch("/api/ai/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, threadId: selectedThread }),
    });
    const j = (await res.json()) as { text?: string };
    return j.text || "";
  }

  async function assistInquiry(action: "draft" | "summarize" | "next") {
    if (!selectedInquiry) return;
    const res = await fetch("/api/ai/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, inquiryId: selectedInquiry }),
    });
    const j = (await res.json()) as { text?: string };
    setAssistPreview(j.text || "");
  }

  return (
    <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-[var(--color-text)] md:text-3xl"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Admin
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Inquiries, client chat, and Groq writing tools.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)] disabled:opacity-50"
        >
          <RefreshCw className={clsx("h-4 w-4", busy && "animate-spin")} />
          Refresh
        </button>
      </header>

      {loadErr ? <p className="mb-6 text-sm text-red-400">{loadErr}</p> : null}

      <div
        className="mb-8 flex gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-4"
        role="tablist"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            )}
          >
            <t.icon className="h-4 w-4" aria-hidden />
            {t.label}
            {t.id === "clients" && (stats?.unreadClientMessages ?? 0) > 0 ? (
              <span className="rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] font-bold text-[#05080f]">
                {stats?.unreadClientMessages}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {tab === "overview" && stats ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Total inquiries", stats.inquiriesTotal],
                ["New inquiries", stats.inquiriesNew],
                ["Client chat threads", stats.activeClientThreads],
                ["Unread client messages", stats.unreadClientMessages],
                ["Messages (7 days)", stats.messagesLast7Days],
                ["Page views (7 days)", stats.pageViewsLast7Days],
              ] as const
            ).map(([label, val], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-6 hover:shadow-[var(--glow-sm)]"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                  {label}
                </p>
                <p
                  className="mt-2 text-3xl font-bold text-[var(--color-text)]"
                  style={{ fontFamily: "var(--font-display), sans-serif" }}
                >
                  {val}
                </p>
              </motion.div>
            ))}
          </div>
        ) : null}

        {tab === "inquiries" ? (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-[var(--color-border)]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/40">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Service</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inquiries.map((row) => (
                    <tr
                      key={row.id}
                      className={clsx(
                        "cursor-pointer border-b border-[var(--color-border)]/60 align-top hover:bg-[var(--color-surface)]/40",
                        selectedInquiry === row.id && "bg-[var(--color-accent-dim)]/20"
                      )}
                      onClick={() => setSelectedInquiry(row.id)}
                    >
                      <td className="p-3 text-[var(--color-muted)]">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-[var(--color-text)]">
                          {row.name}
                        </div>
                        <a
                          href={`mailto:${row.email}`}
                          className="text-[var(--color-accent)] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.email}
                        </a>
                      </td>
                      <td className="p-3 text-[var(--color-muted)]">
                        {row.service_slug}
                      </td>
                      <td className="p-3">
                        <select
                          value={row.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            void patchInquiry(row.id, e.target.value)
                          }
                          className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs"
                        >
                          <option value="new">new</option>
                          <option value="contacted">contacted</option>
                          <option value="closed">closed</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {inquiries.length === 0 ? (
                <p className="p-8 text-center text-sm text-[var(--color-muted)]">
                  No inquiries yet.
                </p>
              ) : null}
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/20 p-4">
              <h2 className="mb-2 flex items-center gap-2 font-semibold text-[var(--color-text)]">
                <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
                Inquiry detail + AI
              </h2>
              {selectedInquiry ? (
                <>
                  {(() => {
                    const row = inquiries.find((i) => i.id === selectedInquiry);
                    if (!row) return null;
                    return (
                      <div className="space-y-3 text-sm">
                        <p className="text-[var(--color-muted)]">{row.message}</p>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              ["draft", "Draft reply"],
                              ["summarize", "Summarize"],
                              ["next", "Next step"],
                            ] as const
                          ).map(([a, label]) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => void assistInquiry(a)}
                              className="rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-[var(--color-accent)]"
                            >
                              {label}
                            </button>
                          ))}
                          <a
                            href={`mailto:${row.email}`}
                            className="rounded-lg bg-[var(--color-accent)] px-2 py-1 text-xs font-semibold text-[#05080f]"
                          >
                            Email client
                          </a>
                        </div>
                        {assistPreview ? (
                          <textarea
                            value={assistPreview}
                            onChange={(e) => setAssistPreview(e.target.value)}
                            rows={8}
                            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm"
                          />
                        ) : null}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  Select an inquiry. AI drafts insert here — you send via email.
                </p>
              )}
            </div>
          </div>
        ) : null}

        {tab === "clients" ? (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/20">
              <div className="border-b border-[var(--color-border)] p-4">
                <h2 className="font-semibold text-[var(--color-text)]">
                  Active clients
                </h2>
              </div>
              <ul className="max-h-[560px] divide-y divide-[var(--color-border)] overflow-y-auto">
                {threads.map((th) => (
                  <li key={th.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedThread(th.id)}
                      className={clsx(
                        "w-full px-4 py-3 text-left text-sm hover:bg-[var(--color-surface)]/50",
                        selectedThread === th.id && "bg-[var(--color-accent-dim)]/30"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[var(--color-text)]">
                          {th.client_email ||
                            th.client_user_id.slice(0, 8) + "…"}
                        </span>
                        {th.unread > 0 ? (
                          <span className="rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] font-bold text-[#05080f]">
                            {th.unread}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {th.messageCount} messages
                      </div>
                      {th.lastMessage ? (
                        <div className="mt-1 line-clamp-2 text-xs text-[var(--color-muted)]">
                          {th.lastMessage.is_admin ? "Team: " : "Client: "}
                          {th.lastMessage.body}
                        </div>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
              {threads.length === 0 ? (
                <p className="p-6 text-center text-sm text-[var(--color-muted)]">
                  No threads until a client opens Messages.
                </p>
              ) : null}
            </div>

            <WhatsAppChat
              mode="admin"
              threadId={selectedThread}
              onComposeAssist={onComposeAssist}
            />
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
