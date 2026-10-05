import { faqItems } from "./faq-data";
import {
  jaccard,
  normalizePersian,
  STOPWORDS,
  tokenize,
  trigrams,
} from "./normalize";
import type { FaqItem, MatchedFaq, Suggestion } from "./types";

/* ------------------------------------------------------------------ */
/*  ریشه‌یابی سبک (Light stemmer) برای فارسی                          */
/* ------------------------------------------------------------------ */

const SUFFIXES = [
  "هایی",
  "های",
  "ترین",
  "ها",
  "تر",
  "ات",
  "اش",
  "ام",
  "شان",
  "مان",
  "تان",
  "ی",
  "ه",
].sort((a, b) => b.length - a.length);

export function stem(word: string): string {
  for (const suffix of SUFFIXES) {
    if (word.length - suffix.length >= 3 && word.endsWith(suffix)) {
      return word.slice(0, word.length - suffix.length);
    }
  }
  return word;
}

/** تبدیل متن به ریشه‌ی کلمات معنادار */
export function stemTokens(text: string): string[] {
  const tokens = tokenize(text, false);
  const stems = tokens.map(stem).filter((s) => s.length > 1 && s.length <= 30);
  const filtered = stems.filter((s) => !STOPWORDS.has(s));
  return filtered.length > 0 ? filtered : stems;
}

/* ------------------------------------------------------------------ */
/*  ساخت ایندکس (یک‌بار در طول عمر پروسه)                              */
/* ------------------------------------------------------------------ */

interface IndexedDoc {
  item: FaqItem;
  normalizedQuestion: string;
  categoryStems: string[];
  questionStems: string[];
  answerStems: string[];
  questionTrigrams: Set<string>;
  questionBigrams: Set<string>;
}

interface SearchIndex {
  docs: IndexedDoc[];
  /** وزن IDF هر ریشه */
  idf: Map<string, number>;
  /** ریشه → شناسه‌ی اسنادی که آن ریشه را دارند (ایندکس معکوس) */
  stemToDocs: Map<string, number[]>;
  /** سه‌نویسه → ریشه‌هایی که آن سه‌نویسه را دارند (برای تطابق فازی سریع) */
  trigramToStems: Map<string, string[]>;
  /** سه‌نویسه‌های هر ریشه‌ی واژگان */
  stemGrams: Map<string, Set<string>>;
  /** کل واژگان (ریشه‌های دیده‌شده) */
  vocabulary: Set<string>;
  total: number;
}

let cachedIndex: SearchIndex | null = null;

/** دو‌ریشه‌ای‌های متوالی؛ برای تشخیص تفاوت پرسش‌های بسیار مشابه */
function stemBigrams(stems: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < stems.length - 1; i += 1) {
    out.add(`${stems[i]}\u0001${stems[i + 1]}`);
  }
  return out;
}

function buildIndex(): SearchIndex {
  const stemToDocs = new Map<string, number[]>();
  const trigramToStems = new Map<string, string[]>();
  const stemGrams = new Map<string, Set<string>>();
  const vocabulary = new Set<string>();

  const docs: IndexedDoc[] = faqItems.map((item, docId) => {
    const questionStems = Array.from(
      new Set(stemTokens(`${item.question} ${item.category}`))
    );
    const answerStems = Array.from(new Set(stemTokens(item.answer)));
    const categoryStems = Array.from(new Set(stemTokens(item.category)));

    const allStems = new Set([
      ...questionStems,
      ...answerStems,
      ...categoryStems,
    ]);

    allStems.forEach((stemKey) => {
      vocabulary.add(stemKey);
      const existing = stemToDocs.get(stemKey);
      if (existing) {
        existing.push(docId);
        return;
      }
      stemToDocs.set(stemKey, [docId]);
      const grams = trigrams(stemKey);
      stemGrams.set(stemKey, grams);
      grams.forEach((gram) => {
        const list = trigramToStems.get(gram);
        if (list) list.push(stemKey);
        else trigramToStems.set(gram, [stemKey]);
      });
    });

    return {
      item,
      normalizedQuestion: normalizePersian(item.question),
      categoryStems,
      questionStems,
      answerStems,
      questionTrigrams: trigrams(item.question),
      questionBigrams: stemBigrams(questionStems),
    };
  });

  const total = docs.length || 1;

  // فراوانی اسناد هر ریشه بر پایه‌ی پرسش‌ها
  const df = new Map<string, number>();
  docs.forEach((doc) => {
    doc.questionStems.forEach((stemKey) => {
      df.set(stemKey, (df.get(stemKey) ?? 0) + 1);
    });
  });

  // IDF به سبک BM25: واژه‌های کم‌تکرار (کلیدواژه‌های متمایزکننده) وزن بسیار بیشتری می‌گیرند
  const idf = new Map<string, number>();
  df.forEach((count, stemKey) => {
    const value = Math.log(1 + (total - count + 0.5) / (count + 0.5));
    idf.set(stemKey, Math.min(4, Math.max(0.12, value)));
  });

  return {
    docs,
    idf,
    stemToDocs,
    trigramToStems,
    stemGrams,
    vocabulary,
    total,
  };
}

function getIndex(): SearchIndex {
  if (!cachedIndex) cachedIndex = buildIndex();
  return cachedIndex;
}

function idfOf(index: SearchIndex, stemKey: string): number {
  const known = index.idf.get(stemKey);
  if (known !== undefined) return known;
  // ریشه‌ای که در پرسش‌ها تکرار نشده ولی در واژگان هست (مثلاً فقط در پاسخ)
  return index.vocabulary.has(stemKey) ? 1.6 : 2.6;
}

/* ------------------------------------------------------------------ */
/*  جست‌وجو                                                            */
/* ------------------------------------------------------------------ */

const WEIGHTS = {
  /** تطابق ریشه‌ای وزن‌دار با IDF */
  token: 0.42,
  /** دو‌ریشه‌ای‌های متوالی (تفکیک پرسش‌های بسیار مشابه) */
  bigram: 0.15,
  /** تشابه سه‌نویسه‌ای کل پرسش */
  trigram: 0.15,
  /** زیررشته‌ی دقیق */
  substring: 0.12,
  /** تطابق با متن پاسخ */
  answer: 0.08,
  /** تطابق موضوع */
  category: 0.08,
};

/** آستانه‌ی پذیرش تطابق فازی ریشه‌ها (تحمل غلط‌املایی) */
const FUZZY_THRESHOLD = 0.6;
/** ضریب کاهش اعتبار تطابق فازی نسبت به تطابق دقیق */
const FUZZY_DECAY = 0.94;

export interface SearchOptions {
  limit?: number;
  /** حداقل امتیاز برای اینکه نتیجه معتبر تلقی شود */
  minScore?: number;
}

/** ریشه‌های نامزد شباهت‌دار با کمک ایندکس سه‌نویسه (بدون پیمایش کل واژگان) */
function candidateStems(
  index: SearchIndex,
  stemKey: string,
  grams: Set<string>
): string[] {
  const found = new Set<string>();
  grams.forEach((gram) => {
    const stems = index.trigramToStems.get(gram);
    if (!stems) return;
    for (const candidate of stems) {
      if (candidate === stemKey) continue;
      if (Math.abs(candidate.length - stemKey.length) > 2) continue;
      found.add(candidate);
    }
  });
  return Array.from(found);
}

/**
 * جست‌وجوی متنی در دانش‌نامه‌ی FAQ
 * ------------------------------------------------------------------
 * ۱) تطابق ریشه‌ای وزن‌دار با IDF (ایندکس معکوس) + تحمل غلط‌املایی
 * ۲) دو‌ریشه‌ای‌های متوالی برای تفکیک پرسش‌های بسیار مشابه
 * ۳) تشابه سه‌نویسه‌ای کل پرسش
 * ۴) زیررشته‌ی دقیق، متن پاسخ و موضوع
 * ------------------------------------------------------------------
 * طراحی‌شده برای دانش‌نامه‌های بزرگ (صدها پرسش) با پرسش‌های نزدیک‌به‌هم.
 */
export function searchFaq(
  rawQuery: string,
  options: SearchOptions = {}
): MatchedFaq[] {
  const { limit = 6, minScore = 0 } = options;
  const query = (rawQuery ?? "").trim();
  if (!query) return [];

  const index = getIndex();
  const normalizedQuery = normalizePersian(query);
  const queryStems = Array.from(new Set(stemTokens(query)));
  if (queryStems.length === 0) return [];

  const queryGrams = new Map<string, Set<string>>();
  queryStems.forEach((stemKey) => queryGrams.set(stemKey, trigrams(stemKey)));
  const queryTrigramSet = trigrams(query);
  const queryBigrams = stemBigrams(queryStems);
  const queryStemSet = new Set(queryStems);
  const queryIdfSum =
    queryStems.reduce((sum, stemKey) => sum + idfOf(index, stemKey), 0) || 1;

  /* --- مرحله ۱: انباشت وزن تطابق ریشه‌ای به‌ازای هر سند --- */
  const overlap = new Map<number, number>();
  const strongMatches = new Map<number, number>();

  const accumulate = (docId: number, weight: number, isStrong: boolean) => {
    overlap.set(docId, (overlap.get(docId) ?? 0) + weight);
    if (isStrong) {
      strongMatches.set(docId, (strongMatches.get(docId) ?? 0) + 1);
    }
  };

  queryStems.forEach((stemKey) => {
    const grams = queryGrams.get(stemKey)!;
    const baseWeight = idfOf(index, stemKey);

    // تطابق دقیق ریشه
    const exactDocs = index.stemToDocs.get(stemKey);
    if (exactDocs) {
      for (const docId of exactDocs) accumulate(docId, baseWeight, true);
    }

    // تطابق فازی ریشه (غلط‌املایی، پسوند متفاوت و…)
    for (const candidate of candidateStems(index, stemKey, grams)) {
      const candidateGrams = index.stemGrams.get(candidate);
      if (!candidateGrams) continue;
      const similarity = jaccard(grams, candidateGrams);
      if (similarity < FUZZY_THRESHOLD) continue;
      const docsOfStem = index.stemToDocs.get(candidate);
      if (!docsOfStem) continue;
      const fuzzyWeight = baseWeight * similarity * FUZZY_DECAY;
      const isStrong = similarity >= 0.8;
      for (const docId of docsOfStem) accumulate(docId, fuzzyWeight, isStrong);
    }
  });

  /* --- مرحله ۲: تعیین اسناد نامزد --- */
  const candidateIds = new Set<number>(overlap.keys());

  // اسنادی که نگارش پرسش‌شان بسیار شبیه است، حتی بدون ریشه‌ی مشترک دقیق
  for (let docId = 0; docId < index.total; docId += 1) {
    if (candidateIds.has(docId)) continue;
    if (jaccard(queryTrigramSet, index.docs[docId].questionTrigrams) >= 0.24) {
      candidateIds.add(docId);
    }
  }

  /* --- مرحله ۳: امتیازدهی نهایی نامزدها --- */
  const scored: MatchedFaq[] = [];

  candidateIds.forEach((docId) => {
    const doc = index.docs[docId];

    // ۱) تطابق ریشه‌ای وزن‌دار
    const tokenScore = Math.min(1, (overlap.get(docId) ?? 0) / queryIdfSum);

    // ۲) دو‌ریشه‌ای‌های متوالی (کلید تفکیک پرسش‌های بسیار مشابه)
    let bigramScore = 0;
    if (queryBigrams.size > 0 && doc.questionBigrams.size > 0) {
      let hits = 0;
      queryBigrams.forEach((bigram) => {
        if (doc.questionBigrams.has(bigram)) hits += 1;
      });
      bigramScore = hits / queryBigrams.size;
    }

    // ۳) تشابه سه‌نویسه‌ای کل پرسش
    const trigramScore = jaccard(queryTrigramSet, doc.questionTrigrams);

    // ۴) تطابق زیررشته (پرسش یکسان یا بسیار نزدیک)
    let substringScore = 0;
    if (normalizedQuery.length >= 5) {
      if (doc.normalizedQuestion.includes(normalizedQuery)) substringScore = 1;
      else if (normalizedQuery.includes(doc.normalizedQuestion)) {
        substringScore = 0.9;
      }
    }

    // ۵) تطابق با متن پاسخ
    let answerOverlap = 0;
    doc.answerStems.forEach((stemKey) => {
      if (queryStemSet.has(stemKey)) answerOverlap += idfOf(index, stemKey);
    });
    const answerScore = Math.min(1, answerOverlap / queryIdfSum);

    // ۶) تطابق موضوع
    let categoryScore = 0;
    if (doc.categoryStems.length > 0) {
      const hits = doc.categoryStems.filter((s) => queryStemSet.has(s)).length;
      categoryScore = hits / doc.categoryStems.length;
    }

    let score =
      WEIGHTS.token * tokenScore +
      WEIGHTS.bigram * bigramScore +
      WEIGHTS.trigram * trigramScore +
      WEIGHTS.substring * substringScore +
      WEIGHTS.answer * answerScore +
      WEIGHTS.category * categoryScore;

    // جریمه‌ی پوشش کم: پرسش‌های پراکنده نباید پاسخ اشتباه بگیرند
    const strong = strongMatches.get(docId) ?? 0;
    if (queryStems.length >= 3) {
      score *= Math.min(1, strong / 2);
    } else if (queryStems.length === 2 && strong === 0) {
      score *= 0.5;
    }

    if (score > minScore) {
      scored.push({ item: doc.item, score: Number(score.toFixed(4)) });
    }
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** آستانه‌های تصمیم‌گیری برای انتخاب نوع پاسخ */
export const SCORE_THRESHOLDS = {
  /** امتیاز بالا: پاسخ قطعی */
  high: 0.45,
  /** امتیاز قابل‌قبول: پاسخ نزدیک‌ترین پرسش + پیشنهاد گزینه‌های جایگزین */
  answer: 0.22,
  /** حد پایین: فقط فهرست پیشنهادها نمایش داده می‌شود */
  suggest: 0.1,
};

/** تبدیل نتایج جست‌وجو به پیشنهادهای قابل نمایش */
export function toSuggestions(results: MatchedFaq[]): Suggestion[] {
  return results.map((r) => ({
    id: r.item.id,
    question: r.item.question,
    score: r.score,
  }));
}

export function getFaqById(id: number): FaqItem | undefined {
  return faqItems.find((item) => item.id === id);
}

export function getFaqsByCategory(category: string, limit = 6): FaqItem[] {
  const normalizedTarget = normalizePersian(category);
  return faqItems
    .filter((item) => {
      const normalized = normalizePersian(item.category);
      return (
        normalized === normalizedTarget || normalized.includes(normalizedTarget)
      );
    })
    .slice(0, limit);
}

/** پیشنهاد پرسش‌های یک دسته‌بندی (برای کلیک روی دسته‌ها) */
export function suggestCategoryQuestions(
  category: string,
  limit = 5
): Suggestion[] {
  return getFaqsByCategory(category, limit).map((item) => ({
    id: item.id,
    question: item.question,
    score: 1,
  }));
}

export function getIndexStats() {
  const index = getIndex();
  return {
    documents: index.docs.length,
    vocabulary: index.vocabulary.size,
    stems: index.stemToDocs.size,
    trigrams: index.trigramToStems.size,
  };
}
