"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { botConfig } from "@/config/bot.config";
import { toPersianDigits } from "@/lib/normalize";
import { useChat } from "@/lib/useChat";
import BrandLogo from "./BrandLogo";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import {
  ArrowDownIcon,
  ChatIcon,
  CloseIcon,
  GridIcon,
  RestartIcon,
  SendIcon,
  ShieldIcon,
} from "./icons";

const MAX_LENGTH = 500;

export default function ChatWidget() {
  const {
    messages,
    quickReplies,
    isTyping,
    isOpen,
    isBooting,
    unread,
    error,
    sendMessage,
    open,
    close,
    restart,
  } = useChat();

  const [draft, setDraft] = useState("");
  const [showJumpButton, setShowJumpButton] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ------------- باز شدن از طریق رویداد سراسری سایت ------------- */
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) pendingRef.current = detail.message;
      open();
    };
    window.addEventListener("chatbot:open", handler);
    return () => window.removeEventListener("chatbot:open", handler);
  }, [open]);

  /* ---------------- قفل اسکرول صفحه در موبایل ---------------- */
  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 640px)").matches;
    if (isOpen && isMobile) document.body.classList.add("chat-open");
    else document.body.classList.remove("chat-open");
    return () => document.body.classList.remove("chat-open");
  }, [isOpen]);

  /* ---------------- فوکوس روی ورودی هنگام باز شدن ---------------- */
  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 260);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  /* ---------------- اسکرول خودکار ---------------- */
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(messages.length > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, isTyping]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowJumpButton(distance > 160);
  }, []);

  /* ---------------- ارسال ---------------- */
  const submit = useCallback(
    (text: string) => {
      const value = text.trim();
      if (!value) return;
      sendMessage(value);
      setDraft("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      window.setTimeout(() => scrollToBottom(true), 40);
    },
    [sendMessage, scrollToBottom]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        submit(draft);
      }
    },
    [draft, submit]
  );

  const handleDraftChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(event.target.value.slice(0, MAX_LENGTH));
      const element = event.target;
      element.style.height = "auto";
      element.style.height = `${Math.min(element.scrollHeight, 120)}px`;
    },
    []
  );

  const showEmptyState = isBooting && messages.length === 0;

  /* ---- ارسال خودکار پیام درخواستی (کلیک روی موضوعات سایت) ---- */
  useEffect(() => {
    if (!pendingRef.current) return;
    if (!isOpen || isBooting || isTyping || messages.length === 0) return;
    const queued = pendingRef.current;
    pendingRef.current = null;
    submit(queued);
  }, [isOpen, isBooting, isTyping, messages.length, submit]);

  return (
    <>
      {/* ------------------------- دکمه شناور ------------------------- */}
      {!isOpen ? (
        <div className="safe-anchor fixed left-4 z-40 flex items-center gap-3 sm:left-6">
          <button
            type="button"
            onClick={open}
            aria-label={botConfig.ui.launcherLabel}
            className="chat-glow group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 text-white shadow-panel transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <ChatIcon className="h-6 w-6" />
            {unread > 0 ? (
              <span className="absolute -left-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-500 px-1 text-[11px] font-extrabold text-brand-950 ring-2 ring-white">
                {unread}
              </span>
            ) : (
              <span className="absolute -top-0.5 -left-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
            )}
          </button>
          <span className="hidden rounded-full bg-white/95 px-3 py-1.5 text-[12px] font-bold text-brand-800 shadow-bubble ring-1 ring-brand-100 backdrop-blur sm:inline-block">
            {botConfig.ui.launcherLabel}
          </span>
        </div>
      ) : null}

      {/* --------------------------- پنل چت --------------------------- */}
      {isOpen ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={botConfig.branding.botName}
          className="fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-white shadow-panel animate-pop-in
                     sm:inset-auto sm:bottom-6 sm:left-6 sm:h-[660px] sm:max-h-[88vh] sm:w-[410px] sm:rounded-3xl sm:ring-1 sm:ring-brand-900/10"
        >
          {/* هدر */}
          <header
            className="chat-gradient relative shrink-0 px-4 pb-4 text-white"
            style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/25 backdrop-blur">
                  <BrandLogo
                    alt={botConfig.branding.companyName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 leading-tight">
                  <h2 className="truncate text-[14px] font-extrabold xs:text-[15px]">
                    {botConfig.ui.panelTitle}
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-white/75 xs:text-[11px]">
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="truncate">
                      {botConfig.ui.onlineLabel}
                      <span className="hidden xs:inline">
                        {" "}
                        — {botConfig.ui.panelSubtitle}
                      </span>
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => submit(botConfig.ui.backToMenu)}
                  title={botConfig.ui.backToMenu}
                  aria-label={botConfig.ui.backToMenu}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
                >
                  <GridIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={restart}
                  title={botConfig.ui.restartLabel}
                  aria-label={botConfig.ui.restartLabel}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
                >
                  <RestartIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  title={botConfig.ui.closeLabel}
                  aria-label={botConfig.ui.closeLabel}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white active:scale-95"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-[10.5px] font-medium text-white/85 ring-1 ring-white/15">
              <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
              {botConfig.branding.companyName}
            </p>
          </header>

          {/* پیام‌ها */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="scrollbar-slim relative flex-1 space-y-4 overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50 to-white px-3.5 py-4 sm:px-4"
          >
            {showEmptyState ? (
              <div className="space-y-4">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={[
                      "h-16 animate-pulse rounded-2xl bg-slate-200/70",
                      index % 2 === 1 ? "mr-auto w-4/5" : "ml-auto w-3/5",
                    ].join(" ")}
                  />
                ))}
              </div>
            ) : null}

            {error && messages.length === 0 ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[12.5px] font-semibold text-rose-700">
                {error}
              </div>
            ) : null}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSuggestionClick={submit}
                disabled={isTyping}
              />
            ))}

            {isTyping ? <TypingIndicator /> : null}

            <div ref={bottomRef} className="h-1 w-full" />
          </div>

          {/* دکمه بازگشت به پایین */}
          {showJumpButton ? (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              aria-label="رفتن به آخرین پیام"
              className="absolute bottom-28 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-700 shadow-bubble ring-1 ring-brand-100 transition hover:bg-brand-50"
            >
              <ArrowDownIcon className="h-4 w-4" />
            </button>
          ) : null}

          {/* پاسخ‌های سریع */}
          {quickReplies.length > 0 && !isTyping ? (
            <div className="scrollbar-slim shrink-0 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
              <div className="flex gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => submit(reply)}
                    className="flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/60 px-3.5 text-[12px] font-bold text-brand-800 transition hover:border-brand-400 hover:bg-brand-100 active:scale-95"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* ورودی پیام */}
          <div
            className="shrink-0 border-t border-slate-100 bg-white px-3 pt-2.5"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-2 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-100">
              <textarea
                ref={inputRef}
                rows={1}
                value={draft}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
                placeholder={botConfig.ui.inputPlaceholder}
                maxLength={MAX_LENGTH}
                disabled={isBooting}
                aria-label={botConfig.ui.inputPlaceholder}
                className="scrollbar-slim max-h-[120px] flex-1 resize-none bg-transparent px-1 py-2 text-base leading-7 text-brand-950 outline-none placeholder:text-slate-400 disabled:opacity-60 sm:py-1.5 sm:text-[13.5px] sm:leading-6"
              />
              <button
                type="button"
                onClick={() => submit(draft)}
                disabled={!draft.trim() || isTyping}
                aria-label={botConfig.ui.sendLabel}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white transition hover:bg-brand-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300 sm:h-9 sm:w-9"
              >
                <SendIcon className="h-4 w-4 -scale-x-100" />
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 px-1">
              <p className="hidden text-[10px] leading-4 text-slate-400 sm:block">
                {botConfig.ui.disclaimer}
              </p>
              <p className="text-[10px] leading-4 text-slate-400 sm:hidden">
                پاسخ‌ها بر پایه سؤالات متداول رسمی است.
              </p>
              {draft.length > MAX_LENGTH - 80 ? (
                <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                  {toPersianDigits(draft.length)}/{toPersianDigits(MAX_LENGTH)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
