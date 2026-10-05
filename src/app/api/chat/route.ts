import { NextResponse, type NextRequest } from "next/server";
import { botConfig } from "@/config/bot.config";
import { getGreetingMessages, handleConversation } from "@/lib/conversation";
import { categories, faqCount } from "@/lib/faq-data";
import type {
  BotMessage,
  ChatRequestBody,
  ChatResponseBody,
  Lead,
  Stage,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGE_LENGTH = 800;
const VALID_STAGES: Stage[] = ["ask_name", "ask_phone", "ready"];

/* --------------------------- محدودیت نرخ --------------------------- */

const RATE_LIMIT = { windowMs: 60_000, max: 40 };
const rateBuckets = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateBuckets.get(key) ?? []).filter(
    (t) => now - t < RATE_LIMIT.windowMs
  );
  hits.push(now);
  rateBuckets.set(key, hits);
  if (rateBuckets.size > 5000) rateBuckets.clear();
  return hits.length > RATE_LIMIT.max;
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? "unknown").trim();
}

/* ----------------------------- ابزارها ----------------------------- */

function sanitizeText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .slice(0, max)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function parseLead(raw: unknown): Lead {
  const lead: Lead = {};
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    const name = sanitizeText(record.name, 60);
    const phone = sanitizeText(record.phone, 20);
    if (name) lead.name = name;
    if (phone) lead.phone = phone;
  }
  return lead;
}

function parseStage(raw: unknown): Stage {
  return VALID_STAGES.includes(raw as Stage) ? (raw as Stage) : "ask_name";
}

/* --------------------- ثبت سرنخ و وب‌هوک اختیاری --------------------- */

async function saveLead(lead: Lead, sessionId: string): Promise<void> {
  const payload = {
    type: "chatbot_lead",
    name: lead.name ?? "",
    phone: lead.phone ?? "",
    sessionId,
    source: botConfig.branding.companyName,
    createdAt: new Date().toISOString(),
  };

  // همیشه در لاگ سرور ثبت می‌شود (در Vercel > Logs قابل مشاهده است)
  console.log("[chatbot][lead]", JSON.stringify(payload));

  const webhook = process.env.LEAD_WEBHOOK_URL;
  if (!webhook) return;
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error("[chatbot][lead][webhook-error]", (error as Error).message);
  }
}

/* ------------------ بازنویسی اختیاری با مدل زبانی LLM ------------------ */

async function refineMessagesWithLLM(
  userMessage: string,
  messages: BotMessage[]
): Promise<BotMessage[]> {
  const enabled = process.env.ENABLE_LLM === "true";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!enabled || !apiKey) return messages;

  const grounded = messages.filter((m) => m.source && m.kind === "text");
  if (grounded.length === 0) return messages;

  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/+$/,
    ""
  );
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `تو دستیار پشتیبانی رسمی «${botConfig.branding.companyName}» هستی.
 فقط و فقط بر اساس «متن مرجع» پاسخ بده. اگر پاسخ در متن مرجع نبود بگو اطلاعات کافی نداری.
 پاسخ را کوتاه، محترمانه، دقیق و به زبان فارسی روان بازنویسی کن. از حدس زدن و افزودن اطلاعات جدید خودداری کن.`,
          },
          {
            role: "user",
            content: `پرسش کاربر: ${userMessage}\n\nمتن مرجع:\n${grounded
              .map((m) => m.text)
              .join("\n---\n")}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) return messages;
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const refined = data.choices?.[0]?.message?.content?.trim();
    if (!refined) return messages;

    let applied = false;
    return messages.map((message) => {
      if (!applied && message.kind === "text" && message.source) {
        applied = true;
        return { ...message, text: refined };
      }
      return message;
    });
  } catch (error) {
    console.error("[chatbot][llm-error]", (error as Error).message);
    return messages;
  }
}

/* ------------------------- هندلر اصلی POST ------------------------- */

export async function POST(request: NextRequest) {
  try {
    const key = clientKey(request);
    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید." },
        { status: 429 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
    const sessionId = sanitizeText(body.sessionId, 64) || "anonymous";
    const stage = parseStage(body.stage);
    const lead = parseLead(body.lead);

    // درخواست پیام‌های آغازین
    if (body.init) {
      const greeting = getGreetingMessages(stage, lead);
      const payload: ChatResponseBody = {
        messages: greeting.messages,
        stage,
        lead,
        quickReplies: greeting.quickReplies,
        confidence: 0,
        matchedFaqId: null,
      };
      return NextResponse.json(payload);
    }

    const message = sanitizeText(body.message, MAX_MESSAGE_LENGTH);
    if (!message) {
      return NextResponse.json(
        { error: "متن پیام خالی است." },
        { status: 400 }
      );
    }

    const result = handleConversation({ message, stage, lead });

    let messages = result.messages;
    if (result.matchedFaqId !== null) {
      messages = await refineMessagesWithLLM(message, messages);
    }

    if (result.leadCompleted && result.lead.phone) {
      // بدون بلوکه کردن پاسخ، سرنخ را ثبت می‌کنیم
      void saveLead(result.lead, sessionId);
    }

    const payload: ChatResponseBody = {
      messages,
      stage: result.stage,
      lead: result.lead,
      quickReplies: result.quickReplies,
      confidence: result.confidence,
      matchedFaqId: result.matchedFaqId,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[chatbot][error]", error);
    return NextResponse.json(
      { error: "خطای داخلی سرور" },
      { status: 500 }
    );
  }
}

/* --------------------- هندلر وضعیت (اختیاری) --------------------- */

export async function GET() {
  return NextResponse.json({
    ok: true,
    bot: botConfig.branding.botName,
    faqCount,
    categories,
    llmEnabled: process.env.ENABLE_LLM === "true",
  });
}
