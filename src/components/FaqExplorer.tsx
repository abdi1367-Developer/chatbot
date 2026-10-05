"use client";

import { useMemo, useState } from "react";
import { toPersianDigits } from "@/lib/normalize";
import OpenChatButton from "./OpenChatButton";
import { ArrowDownIcon, DocumentIcon, GridIcon } from "./icons";

export interface FaqExplorerItem {
  id: number;
  question: string;
  answer: string;
  source?: string;
}

export interface FaqExplorerGroup {
  category: string;
  items: FaqExplorerItem[];
}

interface FaqExplorerProps {
  groups: FaqExplorerGroup[];
  sourceLabel: string;
  /** متن دکمه‌ی پایین هر موضوع */
  chatCtaLabel?: string;
}

/**
 * نمایش پرسش‌های پرتکرار به‌صورت دسته‌بندی‌شده:
 * نوار تب موضوعات + ۶ پرسش هر موضوع به‌صورت آکاردئون.
 */
export default function FaqExplorer({
  groups,
  sourceLabel,
  chatCtaLabel = "مشاهده همه پرسش‌های این موضوع در گفتگو",
}: FaqExplorerProps) {
  const [active, setActive] = useState<string>(groups[0]?.category ?? "");

  const activeGroup = useMemo(
    () => groups.find((group) => group.category === active) ?? groups[0],
    [groups, active]
  );

  if (!activeGroup) return null;

  return (
    <div>
      {/* ---------------------------- تب موضوعات ---------------------------- */}
      <div
        role="tablist"
        aria-label="موضوعات پرسش‌های پرتکرار"
        className="scrollbar-slim -mx-4 flex gap-2 overflow-x-auto px-4 pb-3 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
      >
        {groups.map((group) => {
          const isActive = group.category === activeGroup.category;
          return (
            <button
              key={group.category}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(group.category)}
              className={[
                "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2.5 text-[12.5px] font-bold transition-all duration-300 ease-out",
                isActive
                  ? "bg-brand-800 text-white shadow-lift"
                  : "bg-white text-brand-700 ring-1 ring-brand-100 hover:-translate-y-0.5 hover:text-brand-900 hover:ring-accent-300",
              ].join(" ")}
            >
              {group.category}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-extrabold transition-colors duration-300",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-brand-50 text-brand-500",
                ].join(" ")}
              >
                {toPersianDigits(group.items.length)}
              </span>
            </button>
          );
        })}
      </div>

      {/* ------------------------ پرسش‌های موضوع فعال ------------------------ */}
      <div key={activeGroup.category} className="mt-6 space-y-3">
        {activeGroup.items.map((item, index) => (
          <details
            key={item.id}
            style={{ animationDelay: `${index * 55}ms` }}
            className="group animate-fade-up rounded-2xl border border-brand-100 bg-white px-4 py-3.5 shadow-soft transition-all duration-300 hover:border-accent-300 open:border-accent-300 open:shadow-lift sm:px-5"
          >
            <summary className="flex cursor-pointer list-none items-start gap-3 text-[13px] font-bold leading-7 text-brand-900 [&::-webkit-details-marker]:hidden sm:text-[13.5px]">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-300 group-open:bg-brand-700 group-open:text-white">
                <DocumentIcon className="h-4 w-4" />
              </span>
              <span className="flex-1">{item.question}</span>
              <span className="mt-1 shrink-0 text-brand-400 transition-transform duration-300 group-open:rotate-180">
                <ArrowDownIcon className="h-4 w-4" />
              </span>
            </summary>

            <div className="mt-3 space-y-3 border-t border-dashed border-brand-100 pt-3 pr-10">
              <p className="chat-text text-[12.5px] leading-7 text-brand-900/80">
                {item.answer}
              </p>
              {item.source ? (
                <a
                  href={item.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 underline decoration-dotted underline-offset-4 transition hover:text-brand-800"
                >
                  <DocumentIcon className="h-3 w-3" />
                  {sourceLabel}
                </a>
              ) : null}
            </div>
          </details>
        ))}
      </div>

      {/* ------------------------- فراخوان به گفتگو ------------------------- */}
      <div className="mt-7 flex justify-center">
        <OpenChatButton
          message={activeGroup.category}
          label={activeGroup.category}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent-500 px-5 py-3.5 text-center text-[12.5px] font-extrabold text-brand-950 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-400 hover:shadow-lift active:translate-y-0"
        >
          <GridIcon className="h-4 w-4 shrink-0" />
          <span>
            {chatCtaLabel} «{activeGroup.category}»
          </span>
        </OpenChatButton>
      </div>
    </div>
  );
}
