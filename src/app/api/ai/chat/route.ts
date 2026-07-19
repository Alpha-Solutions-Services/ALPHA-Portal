import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/portal/require-session";
import { createClient } from "@/lib/supabase/server";
import { fetchPortalDashboardData } from "@/lib/sanity/portal-data";

const schema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
});

const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimit(userId: string, max = 30) {
  const now = Date.now();
  const row = rateMap.get(userId);
  if (!row || now > row.reset) {
    rateMap.set(userId, { count: 1, reset: now + 60_000 });
    return true;
  }
  if (row.count >= max) return false;
  row.count += 1;
  return true;
}

function getGroq() {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  return new Groq({ apiKey: key });
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if ("error" in session) return session.error;
  if (!rateLimit(session.user.id)) {
    return NextResponse.json({ error: "Rate limit" }, { status: 429 });
  }

  const groq = getGroq();
  if (!groq) {
    return NextResponse.json(
      { error: "AI is not configured (GROQ_API_KEY)" },
      { status: 503 }
    );
  }

  let parsed: z.infer<typeof schema>;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  let conversationId = parsed.conversationId;
  if (!conversationId) {
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: session.user.id,
        title: parsed.message.slice(0, 60),
      })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "Could not start chat" }, { status: 500 });
    }
    conversationId = data.id as string;
  }

  const { projects } = await fetchPortalDashboardData(session.user.id);
  const projectCtx = projects
    .slice(0, 5)
    .map(
      (p) =>
        `- ${p.name} (${p.status}, ${p.progress}%): ${p.description?.slice(0, 120) || "n/a"}`
    )
    .join("\n");

  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: parsed.message,
  });

  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(20);

  const system = `You are Alpha Assistant for Alpha Solutions Services LLC clients.
Be concise, professional, and helpful. You are NOT a human team member.
If the user needs project decisions, invoices, or urgent help, tell them to use Messages to reach the team or email info@alphasolutions.software / WhatsApp +923494206922.
Company site: https://www.alphasolutions.software
Portal: https://portal.alphasolutions.software

Client projects context:
${projectCtx || "(no projects assigned yet)"}`;

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: system },
      ...((history ?? []) as { role: "user" | "assistant" | "system"; content: string }[]),
    ],
    temperature: 0.5,
    max_tokens: 800,
  });

  const reply =
    completion.choices[0]?.message?.content?.trim() ||
    "Sorry — I could not generate a reply. Please message the team.";

  await supabase.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: reply,
  });

  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({ conversationId, reply });
}

export async function GET() {
  const session = await getSessionUser();
  if ("error" in session) return session.error;
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ conversations: [] });

  const { data } = await supabase
    .from("ai_conversations")
    .select("id, title, updated_at")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ conversations: data ?? [] });
}
