import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdminUser } from "@/lib/admin-auth";
import { getSessionUser } from "@/lib/portal/require-session";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

const schema = z.object({
  action: z.enum(["draft", "summarize", "next"]),
  threadId: z.string().uuid().optional(),
  inquiryId: z.string().uuid().optional(),
});

function getGroq() {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  return new Groq({ apiKey: key });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if ("error" in session) return session.error;
  if (!isAdminUser(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const groq = getGroq();
  if (!groq) {
    return NextResponse.json(
      { error: "Assistant drafting is temporarily unavailable." },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) {
    return NextResponse.json({ error: "DB not configured" }, { status: 503 });
  }

  let context = "";
  if (parsed.threadId) {
    const { data: msgs } = await db
      .from("dm_messages")
      .select("is_admin, body, created_at, deleted_at")
      .eq("thread_id", parsed.threadId)
      .order("created_at", { ascending: true })
      .limit(40);
    context =
      (msgs ?? [])
        .filter((m) => !m.deleted_at)
        .map(
          (m) =>
            `${m.is_admin ? "Admin" : "Client"}: ${m.body || "[attachment]"}`
        )
        .join("\n") || "(empty thread)";
  } else if (parsed.inquiryId) {
    const { data: inq } = await db
      .from("contact_inquiries")
      .select("*")
      .eq("id", parsed.inquiryId)
      .maybeSingle();
    if (inq) {
      context = `Inquiry from ${inq.name} <${inq.email}>\nService: ${inq.service_slug}\nBudget: ${inq.budget || "n/a"}\nMessage: ${inq.message}`;
    }
  }

  const prompts = {
    draft:
      "Draft a professional, warm reply the admin can send. Output ONLY the reply text, no preamble.",
    summarize:
      "Summarize this conversation in 3-5 bullet points for the admin. Output only the bullets.",
    next: "Suggest the single best next action for the admin (1-2 sentences). Output only that suggestion.",
  } as const;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You help Alpha Solutions admins. Never claim you already sent a message. Never invent facts.",
      },
      {
        role: "user",
        content: `${prompts[parsed.action]}\n\nContext:\n${context}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 600,
  });

  const text = completion.choices[0]?.message?.content?.trim() || "";
  return NextResponse.json({ text });
}
