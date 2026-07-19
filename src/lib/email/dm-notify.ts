import {
  brandedEmailWrap,
  createConfiguredTransporter,
  getOpsNotifyEmails,
  resolveSmtpFromAddress,
} from "@/lib/email/transport";
import { getPortalUrl } from "@/lib/supabase/env";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyOpsNewClientMessage(opts: {
  clientEmail?: string | null;
  preview: string;
  threadId: string;
}) {
  const transporter = createConfiguredTransporter();
  if (!transporter) return;
  const portal = getPortalUrl();
  const preview = escapeHtml(opts.preview.slice(0, 280));
  const from = resolveSmtpFromAddress("Alpha Portal <no-reply@alphasolutions.software>");
  try {
    await transporter.sendMail({
      from,
      to: getOpsNotifyEmails(),
      subject: `New client message${opts.clientEmail ? ` from ${opts.clientEmail}` : ""}`,
      html: brandedEmailWrap(
        "Client message",
        `<p>A client sent a portal message.</p>
         <p style="color:#6a8caf;font-size:13px;">From: ${escapeHtml(opts.clientEmail || "unknown")}</p>
         <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #38a3ff;background:#0f1829;color:#edf2f8;">${preview}</blockquote>
         <p><a href="${portal}/admin?tab=clients" style="color:#38a3ff;">Open admin chat</a></p>`
      ),
    });
  } catch (e) {
    console.error("[portal-mail] ops notify failed", e);
  }
}

export async function notifyClientAdminMessage(opts: {
  clientEmail: string;
  preview: string;
}) {
  const transporter = createConfiguredTransporter();
  if (!transporter) return;
  const portal = getPortalUrl();
  const preview = escapeHtml(opts.preview.slice(0, 280));
  const from = resolveSmtpFromAddress("Alpha Solutions <no-reply@alphasolutions.software>");
  try {
    await transporter.sendMail({
      from,
      to: opts.clientEmail,
      subject: "New message from Alpha Solutions",
      html: brandedEmailWrap(
        "Team reply",
        `<p>You have a new message from the Alpha Solutions team.</p>
         <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #38a3ff;background:#0f1829;color:#edf2f8;">${preview}</blockquote>
         <p><a href="${portal}/dashboard?tab=messages" style="display:inline-block;margin-top:8px;padding:10px 18px;background:#38a3ff;color:#05080f;border-radius:8px;text-decoration:none;font-weight:600;">Open portal chat</a></p>`
      ),
    });
  } catch (e) {
    console.error("[portal-mail] client notify failed", e);
  }
}
