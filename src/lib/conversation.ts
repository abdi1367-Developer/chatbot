import { botConfig } from "@/config/bot.config";
import {
  getFaqById,
  getFaqsByCategory,
  SCORE_THRESHOLDS,
  searchFaq,
  toSuggestions,
} from "./engine";
import { categories } from "./faq-data";
import { normalizePersian } from "./normalize";
import type { BotMessage, Lead, Stage } from "./types";

const { messages: T, contact } = botConfig;
/* ------------------------------------------------------------------ */
/*  تشخیص نیت (Intent detection)                                       */
/* ------------------------------------------------------------------ */

const GREETING_WORDS = [
  "سلام",
  "سلام علیکم",
  "درود",
  "hi",
  "hello",
  "hey",
  "صبح بخیر",
  "ظهر بخیر",
  "عصر بخیر",
  "شب بخیر",
  "وقت بخیر",
  "خسته نباشید",
];

const THANKS_WORDS = ["ممنون", "مرسی", "سپاس", "متشکر", "تشکر", "thanks", "thank you", "دمت گرم", "لطف کردی"];
const BYE_WORDS = ["خداحافظ", "خدانگهدار", "بای", "bye", "فعلا", "خدافظ", "میبندم"];
const RESTART_WORDS = ["شروع مجدد", "شروع دوباره", "از ابتدا", "ریست", "reset", "پاک کن", "تغییر اطلاعات", "ویرایش اطلاعات", "restart"];
const HUMAN_WORDS = ["کارشناس", "اپراتور", "پشتیبان", "پشتیبانی انسانی", "انسان", "آدم واقعی", "تماس", "شماره تلفن", "شماره تماس", "تلفن", "human", "agent", "operator", "شکایت"];

function containsAny(text: string, words: string[]): boolean {
  const normalized = normalizePersian(text).toLowerCase();
  if (!normalized) return false;
  const tokens = normalized.split(" ");
  return words.some((w) => {
    const nw = normalizePersian(w).toLowerCase();
    if (!nw) return false;
    if (nw.includes(" ")) return normalized.includes(nw);
    return tokens.includes(nw);
  });
}

export function isGreeting(text: string): boolean {
  return containsAny(text, GREETING_WORDS);
}
export function isThanks(text: string): boolean {
  return containsAny(text, THANKS_WORDS);
}
export function isFarewell(text: string): boolean {
  return containsAny(text, BYE_WORDS);
}
export function isRestart(text: string): boolean {
  return containsAny(text, RESTART_WORDS);
}
export function isHumanRequest(text: string): boolean {
  return containsAny(text, HUMAN_WORDS);
}

const MENU_WORDS = [
  "موضوعات دیگر",
  "موضوعات",
  "موضوع جدید",
  "منو",
  "فهرست",
  "دسته بندی",
  "دسته‌بندی",
  "بازگشت",
  "برگرد",
  "شروع",
  "menu",
];

export function isMenuRequest(text: string): boolean {
  return containsAny(text, MENU_WORDS);
}

/** تعداد کلمات یک متن (برای تشخیص پیام‌های کوتاه مثل «سلام» یا «ممنون») */
function wordCount(text: string): number {
  const normalized = normalizePersian(text);
  return normalized ? normalized.split(" ").filter(Boolean).length : 0;
}

/**
 * پیام‌های کوتاه را می‌توان به‌عنوان نیت (سلام/تشکر/…) تفسیر کرد،
 * اما یک پرسش طولانی نباید با کلمه‌ای مثل «تماس» اشتباه گرفته شود.
 */
const SHORT_MESSAGE_MAX_WORDS = 6;

/* ------------------------------------------------------------------ */
/*  اعتبارسنجی نام و شماره تماس                                        */
/* ------------------------------------------------------------------ */

const IRAN_MOBILE = /^09\d{9}$/;

/** نرمال‌سازی شماره موبایل به قالب 09XXXXXXXXX */
export function normalizePhone(input: string): string | null {
  let digits = normalizePersian(input).replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98") && digits.length >= 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  if (IRAN_MOBILE.test(digits)) return digits;
  return null;
}

const NAME_NOISE = [
  "اسم من",
  "اسمم",
  "نام من",
  "نامم",
  "من",
  "هستم",
  "میباشد",
  "می‌باشد",
  "است",
  "به نام",
  "با نام",
];

/** استخراج و اعتبارسنجی نام کاربر */
export function extractName(input: string): string | null {
  let value = normalizePersian(input);
  if (!value) return null;
  const lower = value.toLowerCase();
  NAME_NOISE.forEach((noise) => {
    const n = normalizePersian(noise);
    const idx = lower.indexOf(n);
    if (idx === 0) value = value.slice(idx + n.length);
  });
  value = value
    .replace(/^[\s\-:،.]+/, "")
    .replace(/[\s\-:،.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!value) return null;
  const letters = value.replace(/[^\u0600-\u06FFa-zA-Zءآأؤإئ]/g, "");
  if (letters.length < 3) return null;
  if (value.length > 40) return null;
  if (isGreeting(value) && letters.length < 12) return null;
  // جلوگیری از ورود شماره به‌جای نام
  if (normalizePhone(value)) return null;
  return value;
}

function formatName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "کاربر";
}

/**
 * فهرست موضوعات نمایشی:
 * ابتدا موضوع‌های اولویت‌دار تنظیمات (اگر در دانش‌نامه وجود داشته باشند)،
 * سپس بقیه‌ی موضوعات موجود در data.json.
 * این کار باعث می‌شود با تغییر دانش‌نامه، فهرست موضوعات خودکار هم‌خوان بماند.
 */
const CATEGORY_REPLIES: string[] = (() => {
  const preferred: string[] = [];
  (botConfig.quickCategories as readonly string[]).forEach((name) => {
    const matched =
      categories.find((real) => real === name) ??
      categories.find((real) => real.includes(name) || name.includes(real));
    if (matched && !preferred.includes(matched)) preferred.push(matched);
  });
  return [...preferred, ...categories.filter((c) => !preferred.includes(c))];
})();

export interface ConversationInput {
  message: string;
  stage?: Stage;
  lead?: Lead;
}

export interface ConversationResult {
  messages: BotMessage[];
  stage: Stage;
  lead: Lead;
  quickReplies: string[];
  confidence: number;
  matchedFaqId: number | null;
  /** اگر در این نوبت سرنخ تکمیل شده باشد true می‌شود (برای ثبت یک‌باره) */
  leadCompleted: boolean;
}

function supportMessage(): BotMessage {
  return {
    kind: "support",
    text: `${T.supportHandoff}\n\n📞 ${contact.supportPhone}\n🕐 ${contact.workingHours}\n🌐 ${botConfig.branding.website}`,
  };
}

function answerMessage(faqId: number): BotMessage | null {
  const item = getFaqById(faqId);
  if (!item) return null;
  return {
    kind: "text",
    text: item.answer,
    source: item.source,
  };
}

/** میان‌برهای همیشه‌حاضر زیر پیام‌های ربات */
const STANDARD_REPLIES: string[] = [
  botConfig.ui.backToMenu,
  botConfig.ui.contactExpert,
];

/** منوی موضوعات (دکمه‌های قابل انتخاب داخل حباب) */
function categoryMenu(text: string): BotMessage {
  return {
    kind: "menu",
    text,
    options: CATEGORY_REPLIES,
    optionsLabel: botConfig.ui.optionsLabel,
  };
}

/** منوی پرسش‌های یک موضوع */
function questionMenu(category: string, limit = 10): BotMessage | null {
  const items = getFaqsByCategory(category, limit);
  if (items.length === 0) return null;
  return {
    kind: "menu",
    text: T.categorySelected.replace("{category}", category),
    options: items.map((item) => item.question),
    optionsLabel: botConfig.ui.optionsLabel,
  };
}

/** پیام‌های آغازین هنگام باز شدن پنجره چت */
export function getGreetingMessages(
  stage: Stage,
  lead: Lead
): { messages: BotMessage[]; quickReplies: string[] } {
  if (stage === "ready" && lead.name) {
    return {
      messages: [
        { kind: "text", text: T.intro },
        { kind: "text", text: T.welcomeBack.replace("{name}", formatName(lead.name)) },
        {
          kind: "menu",
          text: T.welcomePrompt,
          options: CATEGORY_REPLIES,
          optionsLabel: botConfig.ui.optionsLabel,
        },
      ],
      quickReplies: [],
    };
  }
  if (stage === "ask_phone" && lead.name) {
    return {
      messages: [
        { kind: "text", text: T.intro },
        { kind: "text", text: T.askPhone.replace("{name}", formatName(lead.name)) },
      ],
      quickReplies: [],
    };
  }
  return {
    messages: [{ kind: "text", text: T.intro }, { kind: "text", text: T.askName }],
    quickReplies: [],
  };
}

/** تشخیص اینکه کاربر نام یک دسته‌بندی را وارد کرده است */
function matchCategory(text: string): string | null {
  const normalized = normalizePersian(text);
  if (normalized.length < 4) return null;
  let best: string | null = null;
  for (const category of categories) {
    const normalizedCategory = normalizePersian(category);
    if (normalized === normalizedCategory) return category;
    if (normalized.includes(normalizedCategory)) {
      // فقط اگر متن تقریباً همان دسته باشد (کلمات اضافه‌ی کم)
      if (normalized.length <= normalizedCategory.length + 15) {
        if (!best || normalizedCategory.length > normalizePersian(best).length) {
          best = category;
        }
      }
    }
  }
  return best;
}

function handleReady(text: string, base: ConversationResult): ConversationResult {
  const isShort = wordCount(text) <= SHORT_MESSAGE_MAX_WORDS;

  // پیام‌های کوتاه: تشخیص نیت (سلام، تشکر، خداحافظ، منو، کارشناس)
  if (isShort) {
    if (isThanks(text)) {
      return {
        ...base,
        quickReplies: STANDARD_REPLIES,
        messages: [
          { kind: "text", text: T.thanks },
          { kind: "text", text: T.askFreely },
        ],
      };
    }
    if (isFarewell(text)) {
      return { ...base, messages: [{ kind: "text", text: T.bye }] };
    }
    if (isMenuRequest(text)) {
      return {
        ...base,
        confidence: 1,
        quickReplies: [],
        messages: [categoryMenu(T.menuAgain)],
      };
    }
    if (isHumanRequest(text)) {
      return {
        ...base,
        quickReplies: [botConfig.ui.backToMenu],
        messages: [supportMessage()],
      };
    }
    if (isGreeting(text)) {
      return {
        ...base,
        confidence: 1,
        quickReplies: [],
        messages: [categoryMenu(T.greetingAnytime)],
      };
    }
  }

  // اگر کاربر نام یک موضوع را وارد/انتخاب کرد، پرسش‌های آن را نشان بده
  const category = matchCategory(text);
  if (category) {
    const menu = questionMenu(category);
    if (menu) {
      return {
        ...base,
        confidence: 1,
        quickReplies: STANDARD_REPLIES,
        messages: [menu],
      };
    }
  }

  // جست‌وجوی متنی در دانش‌نامه
  const results = searchFaq(text, { limit: 6, minScore: 0.04 });
  const top = results[0];

  /* ۱) تطابق قطعی: پاسخ + پرسش‌های مرتبط */
  if (top && top.score >= SCORE_THRESHOLDS.high) {
    const related = toSuggestions(results.slice(1, 4))
      .filter((s) => s.score >= SCORE_THRESHOLDS.suggest)
      .map((s) => s.question);
    const resolved = answerMessage(top.item.id);
    return {
      ...base,
      confidence: top.score,
      matchedFaqId: top.item.id,
      quickReplies: STANDARD_REPLIES,
      messages: [
        {
          kind: "text",
          text: resolved?.text ?? top.item.answer,
          source: resolved?.source ?? top.item.source,
          options: related.length > 0 ? related : undefined,
          optionsLabel: related.length > 0 ? botConfig.ui.relatedLabel : undefined,
        },
      ],
    };
  }

  /* ۲) نزدیک‌ترین پرسش: پاسخ داده می‌شود و گزینه‌های نزدیک هم پیشنهاد می‌گردد */
  if (top && top.score >= SCORE_THRESHOLDS.answer) {
    const alternatives = toSuggestions(results.slice(1, 5)).map(
      (s) => s.question
    );
    const resolved = answerMessage(top.item.id);
    const answerText = resolved?.text ?? top.item.answer;
    const answerSource = resolved?.source ?? top.item.source;

    if (alternatives.length === 0) {
      return {
        ...base,
        confidence: top.score,
        matchedFaqId: top.item.id,
        quickReplies: STANDARD_REPLIES,
        messages: [{ kind: "text", text: answerText, source: answerSource }],
      };
    }

    return {
      ...base,
      confidence: top.score,
      matchedFaqId: top.item.id,
      quickReplies: STANDARD_REPLIES,
      messages: [
        { kind: "text", text: answerText, source: answerSource },
        {
          kind: "menu",
          text: T.answerWithAlternatives,
          options: alternatives,
          optionsLabel: botConfig.ui.alternativesLabel,
        },
      ],
    };
  }

  /* ۳) اطمینان پایین: فهرست نزدیک‌ترین پرسش‌ها به کاربر پیشنهاد می‌شود */
  if (top && top.score >= SCORE_THRESHOLDS.suggest) {
    return {
      ...base,
      confidence: top.score,
      matchedFaqId: top.item.id,
      quickReplies: STANDARD_REPLIES,
      messages: [
        {
          kind: "menu",
          text: T.didYouMeanMenu,
          options: toSuggestions(results.slice(0, 5)).map((s) => s.question),
          optionsLabel: botConfig.ui.optionsLabel,
        },
      ],
    };
  }

  /* ۴) پاسخی پیدا نشد */
  const options = toSuggestions(results.slice(0, 3)).map((s) => s.question);
  return {
    ...base,
    quickReplies: [botConfig.ui.contactExpert],
    confidence: top?.score ?? 0,
    messages: [
      {
        kind: "fallback",
        text: T.fallback,
        options: options.length > 0 ? options : undefined,
        optionsLabel: options.length > 0 ? botConfig.ui.optionsLabel : undefined,
      },
      supportMessage(),
    ],
  };
}

/**
 * هسته‌ی گفتگو: ورودی کاربر را پردازش و پیام‌های پاسخ را برمی‌گرداند.
 */
export function handleConversation(
  input: ConversationInput
): ConversationResult {
  const text = (input.message ?? "").toString().trim();
  const stage: Stage = input.stage ?? "ask_name";
  const lead: Lead = { ...(input.lead ?? {}) };
  const base: ConversationResult = {
    messages: [],
    stage,
    lead,
    quickReplies: [],
    confidence: 0,
    matchedFaqId: null,
    leadCompleted: false,
  };

  // پیام خالی
  if (!text) {
    if (stage === "ask_name") {
      return { ...base, messages: [{ kind: "text", text: T.askName }] };
    }
    if (stage === "ask_phone") {
      const named = { ...base };
      named.messages = [
        {
          kind: "text",
          text: T.askPhone.replace("{name}", formatName(lead.name ?? "کاربر")),
        },
      ];
      return named;
    }
    return {
      ...base,
      quickReplies: [],
      messages: [categoryMenu(T.greetingAnytime)],
    };
  }

  // شروع مجدد گفتگو از هر مرحله‌ای
  if (isRestart(text)) {
    const fresh = getGreetingMessages("ask_name", {});
    return {
      ...base,
      stage: "ask_name",
      lead: {},
      messages: fresh.messages,
      quickReplies: [],
    };
  }

  // مرحله‌ی ۱: دریافت نام
  if (stage === "ask_name") {
    const name = extractName(text);
    if (!name) {
      return {
        ...base,
        messages: [
          {
            kind: "text",
            text: isGreeting(text) ? T.askName : T.invalidName,
          },
        ],
      };
    }
    return {
      ...base,
      stage: "ask_phone",
      lead: { ...lead, name },
      messages: [
        {
          kind: "text",
          text: T.askPhone.replace("{name}", formatName(name)),
        },
      ],
    };
  }

  // مرحله‌ی ۲: دریافت شماره تماس
  if (stage === "ask_phone") {
    const phone = normalizePhone(text);
    if (!phone) {
      return { ...base, messages: [{ kind: "text", text: T.invalidPhone }] };
    }
    return {
      ...base,
      stage: "ready",
      lead: { ...lead, phone },
      leadCompleted: true,
      quickReplies: [],
      messages: [
        {
          kind: "text",
          text: T.welcomeBack.replace("{name}", formatName(lead.name ?? "کاربر")),
        },
        {
          kind: "menu",
          text: T.welcomePrompt,
          options: CATEGORY_REPLIES,
          optionsLabel: botConfig.ui.optionsLabel,
        },
      ],
    };
  }

  // مرحله‌ی ۳: پاسخ‌گویی
  return handleReady(text, base);
}
