"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  GitBranch,
  Users,
} from "lucide-react";
import clsx from "clsx";

export type CrmProject = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  progress: number;
  category?: string | null;
  project_url?: string | null;
  client_email?: string | null;
  updated_at?: string;
  milestones?: Array<{
    id?: string;
    title: string;
    status: string;
    due_date?: string | null;
  }>;
  team?: Array<{ id?: string; name: string; role?: string | null }>;
  updates?: Array<{
    id?: string;
    title?: string | null;
    body: string;
    author?: string | null;
    created_at?: string;
  }>;
};

const statusLabel: Record<string, string> = {
  planning: "Planning",
  in_progress: "In progress",
  review: "In review",
  completed: "Completed",
  on_hold: "On hold",
};

export function ProjectProgressView({ project }: { project: CrmProject }) {
  const milestones = [...(project.milestones || [])].sort(
    (a, b) => 0
  );
  const updates = [...(project.updates || [])].sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || "")
  );

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[var(--color-border)] bg-[radial-gradient(ellipse_at_top,_rgba(56,163,255,0.12),_transparent_60%)] p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              {project.category || "Project"}
            </p>
            <h2
              className="mt-1 text-2xl font-bold text-[var(--color-text)] md:text-3xl"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {project.title}
            </h2>
            {project.description ? (
              <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
                {project.description}
              </p>
            ) : null}
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
            {statusLabel[project.status] || project.status}
          </span>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs text-[var(--color-muted)]">
            <span className="inline-flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" /> Progress
            </span>
            <span className="font-semibold text-[var(--color-text)]">
              {project.progress}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--color-border)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-[var(--color-accent)] shadow-[var(--glow-sm)]"
            />
          </div>
        </div>

        {project.project_url ? (
          <a
            href={project.project_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--color-accent)] hover:underline"
          >
            Open live site <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </motion.header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <CheckCircle2 className="h-4 w-4 text-[var(--color-accent)]" />
            Milestones
          </h3>
          <ul className="space-y-3">
            {milestones.length === 0 ? (
              <li className="text-sm text-[var(--color-muted)]">
                Milestones will appear as the team plans the work.
              </li>
            ) : (
              milestones.map((m, i) => (
                <li key={m.id || i} className="flex items-start gap-3 text-sm">
                  {m.status === "done" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
                  ) : m.status === "in_progress" ? (
                    <Clock3 className="mt-0.5 h-4 w-4 text-amber-300" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 text-[var(--color-muted)]" />
                  )}
                  <div>
                    <p
                      className={clsx(
                        "font-medium",
                        m.status === "done"
                          ? "text-[var(--color-muted)] line-through"
                          : "text-[var(--color-text)]"
                      )}
                    >
                      {m.title}
                    </p>
                    {m.due_date ? (
                      <p className="text-xs text-[var(--color-muted)]">
                        Due {m.due_date}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Users className="h-4 w-4 text-[var(--color-accent)]" />
            Team on this project
          </h3>
          <ul className="space-y-3">
            {(project.team || []).length === 0 ? (
              <li className="text-sm text-[var(--color-muted)]">
                Your dedicated team will be listed here.
              </li>
            ) : (
              (project.team || []).map((t, i) => (
                <li
                  key={t.id || i}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/40 px-3 py-2"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent-dim)] text-sm font-bold text-[var(--color-accent)]">
                    {t.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {t.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">
                      {t.role || "Team"}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-text)]">
          Activity
        </h3>
        <ol className="relative space-y-4 border-l border-[var(--color-border)] pl-5">
          {updates.length === 0 ? (
            <li className="text-sm text-[var(--color-muted)]">No updates yet.</li>
          ) : (
            updates.map((u, i) => (
              <li key={u.id || i} className="relative">
                <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {u.title || "Update"}
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{u.body}</p>
                <p className="mt-1 text-[11px] text-[var(--color-muted)]">
                  {u.author || "Team"}
                  {u.created_at
                    ? ` · ${new Date(u.created_at).toLocaleString()}`
                    : ""}
                </p>
              </li>
            ))
          )}
        </ol>
      </section>
    </div>
  );
}
