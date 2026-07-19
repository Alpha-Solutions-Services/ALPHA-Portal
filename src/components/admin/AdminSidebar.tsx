"use client";

import Image from "next/image";
import Link from "next/link";
import { Inbox, LayoutDashboard, MessageSquare } from "lucide-react";
import { LogoutButton } from "@/components/portal/LogoutButton";
import { useDashboardMobileNavClose } from "@/components/layout/ResponsiveDashboardShell";

export function AdminSidebar({ email }: { email?: string | null }) {
  const close = useDashboardMobileNavClose();

  const links = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin?tab=inquiries", label: "Inquiries", icon: Inbox },
    { href: "/admin?tab=clients", label: "Clients & chat", icon: MessageSquare },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4">
      <Link
        href="/admin"
        onClick={() => close?.()}
        className="mb-8 flex items-center gap-3"
      >
        <Image
          src="/alpha-logo.png"
          alt="Alpha Solutions"
          width={40}
          height={40}
          className="rounded-lg"
        />
        <div>
          <p
            className="text-sm font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Alpha Portal
          </p>
          <p className="text-[11px] text-[var(--color-muted)]">Admin</p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => close?.()}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--color-muted)] hover:bg-[var(--color-accent-dim)] hover:text-[var(--color-accent)]"
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-3 border-t border-[var(--color-border)] pt-4">
        {email ? (
          <p className="truncate text-xs text-[var(--color-muted)]">{email}</p>
        ) : null}
        <LogoutButton redirectTo="/login?role=admin" />
        <a
          href="https://www.alphasolutions.software"
          className="block text-center text-xs text-[var(--color-accent)] hover:underline"
        >
          Marketing site
        </a>
      </div>
    </aside>
  );
}
