/**
 * scripts/prepare-logo.mjs
 * ---------------------------------------------------------------------------
 * مشکل رایج: فایل لوگو با نام/پسوند اشتباه در پوشه public قرار می‌گیرد
 * (مثلاً یک تصویر PNG با نام logo.svg). در این حالت سرور آن را با
 * Content-Type اشتباه سرو می‌کند و مرورگر نمی‌تواند تصویر را نمایش دهد.
 *
 * این اسکریپت پیش از `next dev` و `next build` اجرا می‌شود و:
 *   ۱) فایل‌های logo.* را در پوشه public پیدا می‌کند.
 *   ۲) فرمت واقعی فایل را از روی امضای باینری (magic bytes) تشخیص می‌دهد.
 *   ۳) اگر پسوند با فرمت واقعی هم‌خوان نباشد، یک کپی با پسوند صحیح
 *      (مثلاً public/logo.png) می‌سازد تا تصویر درست نمایش داده شود.
 *
 * اجرا:  node scripts/prepare-logo.mjs
 */

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PUBLIC_DIR = join(process.cwd(), "public");
const BASE_NAMES = ["logo", "Logo", "LOGO"];

/** تشخیص فرمت تصویر از روی امضای باینری */
function detectImageType(buffer) {
  if (buffer.length < 12) return null;
  const hex = (start, end) => buffer.subarray(start, end).toString("hex");

  if (hex(0, 8) === "89504e470d0a1a0a") return { ext: "png", mime: "image/png" };
  if (hex(0, 2) === "ffd8") return { ext: "jpg", mime: "image/jpeg" };
  if (hex(0, 4) === "47494638") return { ext: "gif", mime: "image/gif" };
  if (hex(0, 4) === "52494646" && hex(8, 12) === "57454250") {
    return { ext: "webp", mime: "image/webp" };
  }
  if (hex(0, 4) === "00000100") return { ext: "ico", mime: "image/x-icon" };

  // SVG یک فایل متنی است
  const head = buffer.subarray(0, 400).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<svg") || head.startsWith("<?xml") || head.includes("<svg")) {
    return { ext: "svg", mime: "image/svg+xml" };
  }
  return null;
}

function main() {
  if (!existsSync(PUBLIC_DIR)) {
    console.log("[prepare-logo] پوشه public پیدا نشد؛ رد شد.");
    return;
  }

  const files = readdirSync(PUBLIC_DIR);
  const candidates = files.filter((file) => {
    const lower = file.toLowerCase();
    if (!lower.startsWith("logo.")) return false;
    if (lower === "logo.example.svg") return false;
    try {
      return statSync(join(PUBLIC_DIR, file)).isFile();
    } catch {
      return false;
    }
  });

  if (candidates.length === 0) {
    console.log("[prepare-logo] فایل لوگویی در public پیدا نشد؛ رد شد.");
    return;
  }

  let created = 0;

  for (const file of candidates) {
    const absolute = join(PUBLIC_DIR, file);
    const buffer = readFileSync(absolute);
    const detected = detectImageType(buffer);
    if (!detected) continue;

    const currentExt = file.split(".").pop()?.toLowerCase() ?? "";
    const isKnown = BASE_NAMES.some(
      (base) => file.toLowerCase() === `${base.toLowerCase()}.${currentExt}`
    );
    if (!isKnown) continue; // فقط logo.* را اصلاح می‌کنیم

    if (currentExt === detected.ext) {
      console.log(`[prepare-logo] ✔ ${file} سالم است (${detected.mime}).`);
      continue;
    }

    const targetName = `logo.${detected.ext}`;
    const target = join(PUBLIC_DIR, targetName);
    if (existsSync(target)) {
      console.log(`[prepare-logo] ✔ ${targetName} از قبل موجود است.`);
      continue;
    }

    writeFileSync(target, buffer);
    created += 1;
    console.log(
      `[prepare-logo] ⚠ «${file}» در واقع یک فایل ${detected.ext.toUpperCase()} است.` +
        ` کپی صحیح ساخته شد: public/${targetName}`
    );
  }

  if (created === 0) {
    console.log("[prepare-logo] همه‌چیز مرتب است.");
  }

  const preferred = ["png", "jpg", "jpeg", "webp", "gif", "svg", "ico"].find((ext) =>
    existsSync(join(PUBLIC_DIR, `logo.${ext}`))
  );
  if (preferred) {
    console.log(`[prepare-logo] → مسیر پیشنهادی برای bot.config.ts: "/logo.${preferred}"`);
  }
}

main();
