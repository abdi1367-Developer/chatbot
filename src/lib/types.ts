export interface FaqItem {
  id: number;
  category: string;
  question: string;
  answer: string;
  source?: string;
}

export interface FaqDataset {
  faq: FaqItem[];
}

/** مرحله‌ی جریان گفتگو (Lead capture) */
export type Stage = "ask_name" | "ask_phone" | "ready";

export interface Lead {
  name?: string;
  phone?: string;
}

export interface MatchedFaq {
  item: FaqItem;
  score: number;
}

export interface Suggestion {
  id: number;
  question: string;
  score: number;
}

/** یک حباب پیام که سرور برمی‌گرداند و کلاینت آن را نمایش می‌دهد */
export interface BotMessage {
  text: string;
  /** نوع پیام برای استایل‌دهی خاص سمت کلاینت */
  kind?: "text" | "support" | "fallback" | "menu";
  /** منبع پاسخ */
  source?: string;
  /** دکمه‌های پاسخ سریع (نوار پایین چت) */
  quickReplies?: string[];
  /** گزینه‌های قابل انتخاب که داخل حباب پیام رندر می‌شوند */
  options?: string[];
  /** عنوان بالای گزینه‌ها */
  optionsLabel?: string;
}

/** پیام نمایش‌داده‌شده در رابط کاربری (شامل پیام‌های کاربر) */
export interface UiMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  kind?: "text" | "support" | "fallback" | "menu";
  source?: string;
  /** گزینه‌های قابل انتخاب داخل حباب */
  options?: string[];
  /** عنوان بالای گزینه‌ها */
  optionsLabel?: string;
  createdAt: number;
  /** نشان می‌دهد پاسخ از دانش‌نامه گرفته شده است */
  answered?: boolean;
}

export interface ChatRequestBody {
  message?: string;
  stage?: Stage;
  lead?: Lead;
  /** شناسه گفتگو برای جلوگیری از ارسال چندباره‌ی سرنخ */
  sessionId?: string;
  /** اگر true باشد، پیام‌های آغازین بازگردانده می‌شود */
  init?: boolean;
}

export interface ChatResponseBody {
  messages: BotMessage[];
  stage: Stage;
  lead: Lead;
  /** پاسخ‌های سریع که تا ارسال پیام بعدی معتبرند */
  quickReplies: string[];
  /** امتیاز اطمینان بهترین تطابق (۰ تا ۱) */
  confidence: number;
  /** شناسه پاسخ متداول انتخاب‌شده (در صورت وجود) */
  matchedFaqId: number | null;
  error?: string;
}
