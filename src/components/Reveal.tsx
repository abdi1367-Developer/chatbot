"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** تأخیر شروع انیمیشن (میلی‌ثانیه) */
  delay?: number;
  /** کلاس‌های اضافه */
  className?: string;
  /** جهت ورود */
  from?: "bottom" | "right" | "left" | "none";
}

const OFFSETS: Record<NonNullable<RevealProps["from"]>, string> = {
  bottom: "translate-y-7",
  right: "translate-x-7",
  left: "-translate-x-7",
  none: "scale-[0.98]",
};

/**
 * نمایش آرام بخش‌ها هنگام ورود به دید کاربر (بدون هیچ کتابخانه‌ی بیرونی).
 * با تنظیم prefers-reduced-motion نیز سازگار است.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
  from = "bottom",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        "transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform motion-reduce:transition-none",
        visible
          ? "translate-x-0 translate-y-0 scale-100 opacity-100"
          : `opacity-0 ${OFFSETS[from]}`,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
