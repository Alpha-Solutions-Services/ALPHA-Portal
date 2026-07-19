"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  FileText,
  FolderKanban,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import type { PortalFile, PortalProject } from "@/lib/sanity/portal-data";
import { ProjectCard } from "./ProjectCard";
import { FileLibrary } from "./FileLibrary";

const DashboardStats = dynamic(
  () => import("./DashboardStats").then((m) => m.DashboardStats),
  { ssr: false }
);
const WhatsAppChat = dynamic(
  () =>
    import("@/components/chat/WhatsAppChat").then((m) => m.WhatsAppChat),
  { ssr: false }
);
const AiChatPanel = dynamic(
  () => import("@/components/ai/AiChatPanel").then((m) => m.AiChatPanel),
  { ssr: false }
);

const WHATSAPP_DIGITS = "923494206922";

const tabs = [
  { id: "overview" as const, label: "Overview", icon: BarChart3 },
  { id: "projects" as const, label: "Projects", icon: FolderKanban },
  { id: "files" as const, label: "Files", icon: FileText },
  { id: "messages" as const, label: "Messages", icon: MessageSquare },
  { id: "ai" as const, label: "AI Assistant", icon: Sparkles },
];

export function PortalDashboardClient({
  projects,
  files,
}: {
  projects: PortalProject[];
  files: PortalFile[];
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]["id"]>("overview");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [aiChats, setAiChats] = useState(0);

  useEffect(() => {
    if (
      tabParam === "projects" ||
      tabParam === "files" ||
      tabParam === "messages" ||
      tabParam === "overview" ||
      tabParam === "ai"
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    void fetch("/api/portal/stats")
      .then((r) => r.json())
      .then((j: { unreadMessages?: number; aiChats?: number }) => {
        setUnreadMessages(j.unreadMessages ?? 0);
        setAiChats(j.aiChats ?? 0);
      })
      .catch(() => {});
  }, [activeTab]);

  const completedProjects = useMemo(
    () => projects.filter((p) => p.status === "Completed").length,
    [projects]
  );
  const inProgressProjects = useMemo(
    () => projects.filter((p) => p.status === "In Progress").length,
    [projects]
  );

  function openWhatsApp() {
    const text = encodeURIComponent(
      "Hello Alpha Solutions team, I have a question about my project:"
    );
    window.open(`https://wa.me/${WHATSAPP_DIGITS}?text=${text}`, "_blank");
  }

  function handleUploadClick() {
    window.alert(
      "Please email files to info@alphasolutions.software or share via chat/WhatsApp."
    );
  }

  return (
    <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 md:p-8">
      <header className="mb-8">
        <h1
          className="text-2xl font-bold text-[var(--color-text)] md:text-3xl"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          Client dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Track projects, files, chat with the team, or ask Alpha AI.
        </p>
      </header>

      <div
        className="mb-8 flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-4"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-[var(--color-accent-dim)] text-[var(--color-accent)]"
                : "text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" aria-hidden />
            {tab.label}
            {tab.id === "messages" && unreadMessages > 0 ? (
              <span className="rounded-full bg-[var(--color-accent)] px-1.5 text-[10px] font-bold text-[#05080f]">
                {unreadMessages}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === "overview" ? (
          <div className="space-y-8">
            <DashboardStats
              totalProjects={projects.length}
              completedProjects={completedProjects}
              inProgressProjects={inProgressProjects}
              unreadMessages={unreadMessages}
              filesCount={files.length}
              aiChats={aiChats}
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("messages")}
                className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#05080f]"
              >
                Message team
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)]"
              >
                Ask AI
              </button>
            </div>
            {projects.length > 0 ? (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
                  Your projects
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.slice(0, 4).map((p) => (
                    <ProjectCard key={p.id} project={p} compact />
                  ))}
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/30 px-6 py-10 text-center">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Your projects will appear here
                </p>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="mt-5 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#05080f]"
                >
                  Message us on WhatsApp
                </button>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "projects" ? (
          <div className="space-y-6">
            {projects.length > 0 ? (
              projects.map((p) => <ProjectCard key={p.id} project={p} />)
            ) : (
              <p className="rounded-xl border border-[var(--color-border)] p-8 text-center text-[var(--color-muted)]">
                No projects yet.
              </p>
            )}
          </div>
        ) : null}

        {activeTab === "files" ? (
          <FileLibrary files={files} onUploadClick={handleUploadClick} />
        ) : null}

        {activeTab === "messages" ? (
          <div className="space-y-4">
            <WhatsAppChat mode="client" />
            <p className="text-center text-xs text-[var(--color-muted)]">
              Urgent?{" "}
              <button
                type="button"
                onClick={openWhatsApp}
                className="font-semibold text-[var(--color-accent)] hover:underline"
              >
                WhatsApp the team
              </button>
            </p>
          </div>
        ) : null}

        {activeTab === "ai" ? <AiChatPanel /> : null}
      </motion.div>
    </div>
  );
}
