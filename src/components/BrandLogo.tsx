"use client";

import { useState } from "react";
import { botConfig } from "@/config/bot.config";

/** فهرست یکتای مسیرهای ممکن برای لوگو */
const SOURCES: string[] = Array.from(
  new Set([botConfig.branding.logo, ...botConfig.branding.logoSources])
).filter(Boolean);

interface BrandLogoProps {
  /** کلاس‌های ظاهری (اندازه، گردی گوشه و…) */
  className?: string;
  /** متن جایگزین تصویر برای دسترس‌پذیری */
  alt?: string;
}

/** نشان پیش‌فرض در صورت نبود هیچ فایل لوگویی */
function FallbackMark({ className }: { className?: string }) {
  return (
    <span
      className={[
        "flex items-center justify-center bg-gradient-to-br from-brand-700 to-brand-950",
        className ?? "",
      ].join(" ")}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-3/5 w-3/5" role="img">
        <defs>
          <linearGradient id="bl-accent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7bd9be" />
            <stop offset="100%" stopColor="#339379" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="24"
          fill="none"
          stroke="url(#bl-accent)"
          strokeWidth="2.5"
          opacity="0.9"
        />
        <path
          d="M32 12 L36.6 27.4 L52 32 L36.6 36.6 L32 52 L27.4 36.6 L12 32 L27.4 27.4 Z"
          fill="url(#bl-accent)"
        />
      </svg>
    </span>
  );
}

/**
 * نمایش لوگو با زنجیره‌ی مسیرهای جایگزین.
 * اگر مسیر اصلی باز نشود (مثلاً نام یا پسوند فایل متفاوت باشد)،
 * به‌ترتیب مسیرهای دیگر امتحان می‌شوند و در نهایت نشان پیش‌فرض نمایش می‌یابد.
 */
export default function BrandLogo({ className, alt }: BrandLogoProps) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  if (failed || index >= SOURCES.length) {
    return <FallbackMark className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SOURCES[index]}
      alt={alt ?? botConfig.branding.companyName}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => {
        if (index + 1 < SOURCES.length) setIndex((current) => current + 1);
        else setFailed(true);
      }}
    />
  );
}
