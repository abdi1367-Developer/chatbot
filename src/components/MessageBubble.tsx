"use client";

import type { ReactNode } from "react";
import { botConfig } from "@/config/bot.config";
import { toPersianDigits } from "@/lib/normalize";
import type { UiMessage } from "@/lib/types";
import BrandLogo from "./BrandLogo";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  PhoneIcon,
  UserIcon,
} from "./icons";

function renderInline(line: string): ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={index} className="font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function renderRichText(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, index) => (
    <span key={index}>
      {renderInline(line)}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface MessageBubbleProps {
  message: UiMessage;
  onSuggestionClick: (question: string) => void;
  disabled?: boolean;
}

export default function MessageBubble({
  message,
  onSuggestionClick,
  disabled,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-2 animate-fade-up">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 ring-1 ring-brand-200">
          <UserIcon className="h-4 w-4" />
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-brand-700 px-4 py-3 text-white shadow-bubble">
          <p className="chat-text text-[13.5px] font-medium">
            {renderRichText(message.text)}
          </p>
          <span className="mt-1 block text-[10px] text-white/60">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2 animate-fade-up">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brand-900 ring-1 ring-brand-700/40">
        <BrandLogo
          alt={botConfig.branding.botName}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 max-w-[88%] space-y-2">
        <div
          className={[
            "rounded-2xl rounded-br-md border px-4 py-3 shadow-bubble",
            message.kind === "fallback"
              ? "border-amber-200 bg-amber-50/80"
              : message.kind === "menu"
                ? "border-brand-200 bg-brand-50/70"
                : "border-slate-200 bg-white",
          ].join(" ")}
        >
          <p className="chat-text text-[13.5px] text-brand-950/90">
            {renderRichText(message.text)}
          </p>

          {message.kind === "support" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`tel:${botConfig.contact.supportPhoneRaw}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-800 px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-brand-700"
              >
                <PhoneIcon className="h-3.5 w-3.5" />
                تماس تلفنی
              </a>
              <a
                href={botConfig.branding.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-3 py-1.5 text-[12px] font-bold text-brand-800 transition hover:bg-brand-50"
              >
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                وب‌سایت رسمی
              </a>
            </div>
          ) : null}

          {message.source ? (
            <a
              href={message.source}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 underline decoration-dotted underline-offset-4 transition hover:text-brand-800"
            >
              <ExternalLinkIcon className="h-3 w-3" />
              {botConfig.ui.sourceLabel}
            </a>
          ) : null}
        </div>

        {message.options && message.options.length > 0 ? (
          <div className="space-y-2">
            {message.optionsLabel ? (
              <p className="pr-1 text-[11.5px] font-bold text-brand-700">
                {message.optionsLabel}
              </p>
            ) : null}
            <div className="scrollbar-slim flex max-h-[290px] flex-col gap-1.5 overflow-y-auto">
              {message.options.map((option, optionIndex) => (
                <button
                  key={`${message.id}-${optionIndex}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSuggestionClick(option)}
                  className="group flex w-full items-start gap-2.5 rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-right text-[12.5px] font-semibold leading-6 text-brand-900 shadow-sm transition hover:border-brand-500 hover:bg-brand-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-700 text-[10.5px] font-extrabold text-white transition group-hover:bg-brand-600">
                    {toPersianDigits(optionIndex + 1)}
                  </span>
                  <span className="flex-1">{option}</span>
                  <ArrowLeftIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-300 transition group-hover:text-brand-600" />
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <span className="block pr-1 text-[10px] text-brand-400">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
