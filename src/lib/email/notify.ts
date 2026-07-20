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

async function send(opts: {
  to: string | string[];
  subject: string;
  title: string;
  html: string;
}) {
  const transporter = createConfiguredTransporter();
  if (!transporter) {
    console.warn("[portal-mail] skip — SMTP not configured:", opts.subject);
    return;
  }
  const from = resolveSmtpFromAddress(
    "Alpha Solutions <no-reply@alphasolutions.software>"
  );
  try {
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: brandedEmailWrap(opts.title, opts.html),
    });
  } catch (e) {
    console.error("[portal-mail] send failed", opts.subject, e);
  }
}

export async function notifyOps(opts: {
  subject: string;
  title: string;
  html: string;
}) {
  await send({
    to: getOpsNotifyEmails(),
    subject: opts.subject,
    title: opts.title,
    html: opts.html,
  });
}

export async function notifyUser(opts: {
  email: string;
  subject: string;
  title: string;
  html: string;
}) {
  await send({
    to: opts.email,
    subject: opts.subject,
    title: opts.title,
    html: opts.html,
  });
}

export { escapeHtml };

export async function emailTicketCreated(opts: {
  clientEmail?: string | null;
  subject: string;
  description: string;
  ticketId: string;
}) {
  const portal = getPortalUrl();
  const preview = escapeHtml(opts.description.slice(0, 400));
  await notifyOps({
    subject: `New support ticket: ${opts.subject}`,
    title: "New ticket",
    html: `<p>Client opened a support ticket.</p>
      <p style="color:#6a8caf;font-size:13px;">From: ${escapeHtml(opts.clientEmail || "unknown")}</p>
      <p><strong>${escapeHtml(opts.subject)}</strong></p>
      <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #38a3ff;background:#0f1829;">${preview}</blockquote>
      <p><a href="${portal}/admin?tab=tickets" style="color:#38a3ff;">Open tickets</a></p>`,
  });
  if (opts.clientEmail) {
    await notifyUser({
      email: opts.clientEmail,
      subject: `Ticket received: ${opts.subject}`,
      title: "Ticket received",
      html: `<p>We received your support ticket and will respond soon.</p>
        <p><strong>${escapeHtml(opts.subject)}</strong></p>
        <p><a href="${portal}/dashboard?tab=tickets" style="display:inline-block;padding:10px 18px;background:#38a3ff;color:#05080f;border-radius:8px;text-decoration:none;font-weight:600;">View ticket</a></p>`,
    });
  }
}

export async function emailTicketReply(opts: {
  clientEmail: string;
  subject: string;
  preview: string;
  fromAdmin: boolean;
}) {
  const portal = getPortalUrl();
  if (opts.fromAdmin) {
    await notifyUser({
      email: opts.clientEmail,
      subject: `Reply on ticket: ${opts.subject}`,
      title: "Ticket update",
      html: `<p>The Alpha Solutions team replied to your ticket.</p>
        <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #38a3ff;background:#0f1829;">${escapeHtml(opts.preview.slice(0, 280))}</blockquote>
        <p><a href="${portal}/dashboard?tab=tickets" style="color:#38a3ff;">Open ticket</a></p>`,
    });
  } else {
    await notifyOps({
      subject: `Client reply on ticket: ${opts.subject}`,
      title: "Ticket reply",
      html: `<p>${escapeHtml(opts.clientEmail)} replied on a ticket.</p>
        <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #38a3ff;background:#0f1829;">${escapeHtml(opts.preview.slice(0, 280))}</blockquote>
        <p><a href="${portal}/admin?tab=tickets" style="color:#38a3ff;">Open tickets</a></p>`,
    });
  }
}

export async function emailProjectAssigned(opts: {
  clientEmail: string;
  title: string;
  projectId: string;
}) {
  const portal = getPortalUrl();
  await notifyUser({
    email: opts.clientEmail,
    subject: `New project: ${opts.title}`,
    title: "Project created",
    html: `<p>A new project was created for you.</p>
      <p><strong>${escapeHtml(opts.title)}</strong></p>
      <p><a href="${portal}/dashboard?tab=projects&project=${opts.projectId}" style="display:inline-block;padding:10px 18px;background:#38a3ff;color:#05080f;border-radius:8px;text-decoration:none;font-weight:600;">View project</a></p>`,
  });
  await notifyOps({
    subject: `Project created: ${opts.title}`,
    title: "Project created",
    html: `<p>Assigned to ${escapeHtml(opts.clientEmail)}</p>
      <p><strong>${escapeHtml(opts.title)}</strong></p>
      <p><a href="${portal}/admin?tab=projects" style="color:#38a3ff;">Open projects</a></p>`,
  });
}

export async function emailAiChat(opts: {
  clientEmail?: string | null;
  userMessage: string;
  assistantReply: string;
  conversationId: string;
}) {
  const portal = getPortalUrl();
  await notifyOps({
    subject: `Alpha Assistant chat${opts.clientEmail ? ` — ${opts.clientEmail}` : ""}`,
    title: "Assistant conversation",
    html: `<p>Client spoke with Alpha Assistant.</p>
      <p style="color:#6a8caf;font-size:13px;">${escapeHtml(opts.clientEmail || "unknown")}</p>
      <p><strong>Client:</strong></p>
      <blockquote style="margin:8px 0 16px;padding:12px 16px;border-left:3px solid #38a3ff;background:#0f1829;">${escapeHtml(opts.userMessage.slice(0, 400))}</blockquote>
      <p><strong>Assistant:</strong></p>
      <blockquote style="margin:8px 0 16px;padding:12px 16px;border-left:3px solid #5bc8ff;background:#0f1829;">${escapeHtml(opts.assistantReply.slice(0, 400))}</blockquote>
      <p><a href="${portal}/admin?tab=ai&c=${opts.conversationId}" style="color:#38a3ff;">Open shared chat</a></p>`,
  });
}

export async function emailHumanJoined(opts: {
  clientEmail: string;
  conversationId: string;
}) {
  const portal = getPortalUrl();
  await notifyUser({
    email: opts.clientEmail,
    subject: "A team member joined your chat",
    title: "Human support",
    html: `<p>An Alpha Solutions team member has joined your Assistant conversation.</p>
      <p><a href="${portal}/dashboard?tab=ai" style="color:#38a3ff;">Return to chat</a></p>`,
  });
}
