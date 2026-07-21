"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { useUi } from "@/components/ui/UiProvider";

type StaffRow = {
  id: string;
  email: string;
  role: string;
  active: boolean;
  display_name?: string | null;
};

export function AdminStaffPageClient() {
  const { toast, confirm } = useUi();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [me, setMe] = useState<{
    email?: string;
    role?: string;
    isOwner?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"owner" | "staff">("staff");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/staff");
    const j = await res.json();
    if (!res.ok) {
      toast({ kind: "error", title: j.error || "Failed to load staff" });
      return;
    }
    setMe(j.me);
    setStaff(j.staff ?? []);
  }, [toast]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Invite failed");
      toast({
        kind: "success",
        title: "Staff saved",
        message: j.hint,
      });
      setEmail("");
      await load();
    } catch (err) {
      toast({
        kind: "error",
        title: "Invite failed",
        message: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, staffEmail: string) {
    const ok = await confirm({
      title: "Remove staff?",
      message: `Remove ${staffEmail} from portal staff.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/staff?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast({ kind: "error", title: "Could not remove staff" });
      return;
    }
    toast({ kind: "success", title: "Staff removed" });
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-[var(--color-accent)]" />
        <div>
          <h1
            className="text-2xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Staff
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            Owner-only. You: {me?.email} ({me?.role})
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void invite(e)}
        className="grid gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/30 p-4 sm:grid-cols-[1fr_auto_auto]"
      >
        <input
          required
          type="email"
          placeholder="staff@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "owner" | "staff")}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm"
        >
          <option value="staff">staff</option>
          <option value="owner">owner</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#05080f] disabled:opacity-50"
        >
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Invite"}
        </button>
      </form>

      <div className="overflow-auto rounded-2xl border border-[var(--color-border)]">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
            <tr>
              <th className="p-3 text-[var(--color-muted)]">Email</th>
              <th className="p-3 text-[var(--color-muted)]">Role</th>
              <th className="p-3 text-[var(--color-muted)]">Active</th>
              <th className="p-3 text-[var(--color-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-[var(--color-muted)]"
                >
                  No DB staff rows yet. Env ADMIN_EMAILS still grant access.
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--color-border)]/50"
                >
                  <td className="p-3 text-[var(--color-text)]">{s.email}</td>
                  <td className="p-3 capitalize text-[var(--color-muted)]">
                    {s.role}
                  </td>
                  <td className="p-3 text-[var(--color-muted)]">
                    {s.active ? "yes" : "no"}
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => void remove(s.id, s.email)}
                      className="rounded-lg border border-red-500/40 px-2 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
