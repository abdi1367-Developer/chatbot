import rawData from "../../data.json";
import type { FaqDataset, FaqItem } from "./types";

/**
 * بارگذاری دانش‌نامه‌ی چت‌بات از فایل data.json
 * این فایل در ریشه‌ی پروژه است و هنگام build داخل باندل قرار می‌گیرد
 * (روی Vercel نیازی به دیتابیس یا سرویس جانبی نیست).
 */
const dataset = rawData as unknown as FaqDataset;

/** حذف نشانگرهای داخلی مثل [reference:22] از متن پاسخ */
export function cleanAnswer(answer: string): string {
  if (!answer) return "";
  return answer
    .replace(/\[reference:\d+\]/gi, "")
    .replace(/\s+([.،؛])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const faqItems: FaqItem[] = (Array.isArray(dataset.faq) ? dataset.faq : [])
  .map((item) => ({
    ...item,
    answer: cleanAnswer(item.answer),
  }))
  .filter((item) => Boolean(item.question));

/** فهرست یکتای دسته‌بندی‌ها */
export const categories: string[] = Array.from(
  new Set(faqItems.map((item) => item.category))
);

export const faqCount = faqItems.length;

export interface FaqGroup {
  category: string;
  items: FaqItem[];
}

/**
 * دسته‌بندی پرسش‌ها بر اساس موضوع و انتخاب پرتکرارترین‌ها از هر دسته.
 * ترتیب موضوعات همان ترتیب فایل data.json است.
 */
export function buildFaqGroups(perCategory = 6): FaqGroup[] {
  const buckets = new Map<string, FaqItem[]>();
  categories.forEach((category) => buckets.set(category, []));
  faqItems.forEach((item) => {
    const bucket = buckets.get(item.category);
    if (bucket) bucket.push(item);
  });

  return categories
    .map((category) => ({
      category,
      items: (buckets.get(category) ?? []).slice(0, perCategory),
    }))
    .filter((group) => group.items.length > 0);
}
