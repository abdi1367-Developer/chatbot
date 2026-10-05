"use client";

import type { ReactNode } from "react";

interface OpenChatButtonProps {
  children: ReactNode;
  className?: string;
  label?: string;
  /**
   * اگر مقدار داشته باشد، پس از باز شدن چت، این متن به‌صورت خودکار
   * به‌عنوان پیام کاربر ارسال می‌شود (مثلاً نام یک موضوع).
   */
  message?: string;
}

/**
 * دکمه‌ای که پنجره‌ی گفتگو را باز می‌کند.
 * از یک رویداد سراسری استفاده می‌کند تا در هر جای سایت قابل استفاده باشد.
 */
export default function OpenChatButton({
  children,
  className,
  label,
  message,
}: OpenChatButtonProps) {
  const handleClick = () => {
    if (typeof window === "undefined") return;
    if (message) {
      window.dispatchEvent(
        new CustomEvent("chatbot:open", { detail: { message } })
      );
    } else {
      window.dispatchEvent(new Event("chatbot:open"));
    }
  };

  return (
    <button type="button" onClick={handleClick} aria-label={label} className={className}>
      {children}
    </button>
  );
}
