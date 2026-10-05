/**
 * ابزارهای نرمال‌سازی و توکن‌سازی متن فارسی
 * ---------------------------------------------------------
 * هدف: یکسان‌سازی نویسه‌های عربی/فارسی و اعداد تا جست‌وجو
 * دقیق و مقاوم به غلط‌املایی انجام شود.
 */

const ARABIC_INDIC_DIGITS = /[\u0660-\u0669]/g; // ٠١٢٣٤٥٦٧٨٩
const EXTENDED_ARABIC_INDIC_DIGITS = /[\u06F0-\u06F9]/g; // ۰۱۲۳۴۵۶۷۸۹

// اعراب (حرکات) + تنوین + تشدید + کشیده (تطویل) + اعراب قرآنی
const DIACRITICS = /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;

// نویسه‌های کنترلی و جهت‌دهی متن (بدون نیم‌فاصله)
const ZERO_WIDTH = /[\u200B\u200D\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g;

// نیم‌فاصله (ZWNJ) جداگانه به فاصله تبدیل می‌شود
const ZWNJ = /\u200C/g;

/** نرمال‌سازی پایه‌ی متن فارسی */
export function normalizePersian(input: string): string {
  if (!input) return "";
  let text = input.normalize("NFC");

  // تبدیل اعداد عربی/فارسی به لاتین
  text = text.replace(ARABIC_INDIC_DIGITS, (d) =>
    String(d.charCodeAt(0) - 0x0660)
  );
  text = text.replace(EXTENDED_ARABIC_INDIC_DIGITS, (d) =>
    String(d.charCodeAt(0) - 0x06f0)
  );

  // یکسان‌سازی حروف
  text = text.replace(/[يىئﻯﻰ]/g, "ی"); // ی عربی
  text = text.replace(/[ك]/g, "ک"); // ک عربی
  text = text.replace(/[ةۀهٔ]/g, "ه");
  text = text.replace(/[أإآٱاﻷﻹﻵ]/g, "ا");
  text = text.replace(/[ؤ]/g, "و");
  text = text.replace(/[ى]/g, "ی");

  // نیم‌فاصله (ZWNJ) ابتدا به فاصله تبدیل می‌شود
  text = text.replace(ZWNJ, " ");

  // حذف اعراب و نویسه‌های بی‌اثر
  text = text.replace(DIACRITICS, "");
  text = text.replace(ZERO_WIDTH, "");

  // حذف علائم نگارشی و کاراکترهای خاص
  text = text.replace(
    /[.,،؛:!?؟"'`´«»\(\)\[\]\{\}<>\/\\|~^*_+=#$%@&§¶©®™°~–—…‌]/g,
    " "
  );

  // حذف فاصله‌های اضافه
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/** کلمات ربط و بی‌ارزش برای امتیازدهی */
export const STOPWORDS = new Set<string>([
  "از",
  "به",
  "با",
  "در",
  "که",
  "این",
  "آن",
  "را",
  "برای",
  "است",
  "هست",
  "می",
  "شود",
  "شد",
  "شدن",
  "باشد",
  "باشد",
  "یک",
  "های",
  "ها",
  "هم",
  "یا",
  "و",
  "اگر",
  "تا",
  "همان",
  "همین",
  "چه",
  "چی",
  "چگونه",
  "چطور",
  "کجا",
  "کی",
  "آیا",
  "باید",
  "میباشد",
  "می‌باشد",
  "کنم",
  "کنید",
  "کند",
  "دارد",
  "دارم",
  "دارید",
  "خود",
  "شما",
  "من",
  "ما",
  "آنها",
  "وی",
  "بر",
  "بلکه",
  "ولی",
  "اما",
  "لطفا",
  "سلام",
  "ممنون",
  "مرسی",
  "خواهم",
  "کدام",
  "کدامیک",
  "بنده",
  "درباره",
  "مورد",
  "نظر",
  "توان",
  "توانم",
  "بتوانم",
  "لطفاً",
]);

/** تبدیل متن به توکن‌های معنادار */
export function tokenize(input: string, removeStopwords = true): string[] {
  const normalized = normalizePersian(input);
  if (!normalized) return [];
  const raw = normalized.split(" ").filter(Boolean);
  const tokens = raw.filter((t) => t.length > 1 || /[0-9]/.test(t));
  if (!removeStopwords) return tokens;
  const filtered = tokens.filter((t) => !STOPWORDS.has(t));
  // اگر همه کلمات حذف شدند، حداقل کلمات اصلی را برگردان
  return filtered.length > 0 ? filtered : tokens;
}

/** بردار سه‌نویسه‌ای (trigram) برای تشخیص تشابه فازی و غلط‌املایی */
export function trigrams(input: string): Set<string> {
  const normalized = normalizePersian(input).replace(/\s+/g, " ");
  const padded = ` ${normalized} `;
  const result = new Set<string>();
  if (padded.length < 3) {
    if (padded.length > 0) result.add(padded);
    return result;
  }
  for (let i = 0; i < padded.length - 2; i += 1) {
    result.add(padded.slice(i, i + 3));
  }
  return result;
}

/** شباهت جاکارد بین دو مجموعه */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  small.forEach((value) => {
    if (large.has(value)) intersection += 1;
  });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** تشخیص اینکه متن عمدتاً فارسی/عربی است */
export function isPersianText(input: string): boolean {
  return /[\u0600-\u06FF]/.test(input);
}

/** تبدیل اعداد لاتین به اعداد فارسی برای نمایش */
export function toPersianDigits(input: string | number): string {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/[0-9]/g, (digit) => map[Number(digit)]);
}
