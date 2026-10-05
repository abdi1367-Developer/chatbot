"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BotMessage,
  ChatResponseBody,
  Lead,
  Stage,
  UiMessage,
} from "./types";

const STORAGE_KEY = "ice-smart-chatbot:v1";

interface PersistedState {
  messages: UiMessage[];
  stage: Stage;
  lead: Lead;
  sessionId: string;
  updatedAt: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function typingDelayFor(text: string): number {
  return Math.min(1500, Math.max(420, 320 + text.length * 9));
}

function toUiMessage(message: BotMessage): UiMessage {
  return {
    id: uid(),
    role: "bot",
    text: message.text,
    kind: message.kind ?? "text",
    source: message.source,
    options: message.options,
    optionsLabel: message.optionsLabel,
    createdAt: Date.now(),
  };
}

export interface UseChatResult {
  messages: UiMessage[];
  quickReplies: string[];
  isTyping: boolean;
  isOpen: boolean;
  isBooting: boolean;
  unread: number;
  error: string | null;
  stage: Stage;
  lead: Lead;
  sendMessage: (text: string) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  restart: () => void;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("ask_name");
  const [lead, setLead] = useState<Lead>({});
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const sessionIdRef = useRef<string>("");
  const hydratedRef = useRef(false);
  const busyRef = useRef(false);
  const openRef = useRef(false);
  const startedRef = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* ---------------------- بازیابی از localStorage ---------------------- */
  useEffect(() => {
    sessionIdRef.current = uid();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedState>;
        if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages);
          setStage(parsed.stage ?? "ask_name");
          setLead(parsed.lead ?? {});
          startedRef.current = true;
        }
        if (typeof parsed.sessionId === "string" && parsed.sessionId) {
          sessionIdRef.current = parsed.sessionId;
        }
      }
    } catch {
      /* نادیده گرفتن داده‌ی خراب */
    }
    hydratedRef.current = true;
  }, []);

  /* --------------------------- ذخیره‌سازی --------------------------- */
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (messages.length === 0) return;
    const state: PersistedState = {
      messages: messages.slice(-80),
      stage,
      lead,
      sessionId: sessionIdRef.current,
      updatedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* حافظه پر است */
    }
  }, [messages, stage, lead]);

  /* ----------------------- نمایش پیام‌های ربات ----------------------- */
  const appendBotMessages = useCallback(async (incoming: BotMessage[]) => {
    for (let index = 0; index < incoming.length; index += 1) {
      if (!aliveRef.current) return;
      const message = incoming[index];
      setIsTyping(true);
      await delay(typingDelayFor(message.text));
      if (!aliveRef.current) return;
      setIsTyping(false);
      setMessages((previous) => [...previous, toUiMessage(message)]);
      if (!openRef.current) setUnread((count) => count + 1);
      if (index < incoming.length - 1) await delay(220);
    }
  }, []);

  /* -------------------- بارگذاری اولیه و شروع مجدد -------------------- */
  const start = useCallback(
    async (force = false, initialStage?: Stage, initialLead?: Lead) => {
      if (busyRef.current) return;
      if (startedRef.current && !force) return;
      busyRef.current = true;
      setIsBooting(true);
      setError(null);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            init: true,
            stage: initialStage ?? stage,
            lead: initialLead ?? lead,
            sessionId: sessionIdRef.current,
          }),
        });
        if (!response.ok) throw new Error("init-failed");
        const data = (await response.json()) as ChatResponseBody;
        if (!aliveRef.current) return;
        startedRef.current = true;
        await appendBotMessages(data.messages);
        if (!aliveRef.current) return;
        setStage(data.stage);
        setLead(data.lead);
        setQuickReplies(data.quickReplies ?? []);
      } catch {
        if (aliveRef.current) {
          setError(
            "ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت خود را بررسی کنید."
          );
        }
      } finally {
        busyRef.current = false;
        if (aliveRef.current) setIsBooting(false);
      }
    },
    [appendBotMessages, stage, lead]
  );

  /* ------------------------------ ارسال ------------------------------ */
  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || busyRef.current) return;
      busyRef.current = true;
      setError(null);

      const userMessage: UiMessage = {
        id: uid(),
        role: "user",
        text,
        createdAt: Date.now(),
      };
      setMessages((previous) => [...previous, userMessage]);
      setQuickReplies([]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            stage,
            lead,
            sessionId: sessionIdRef.current,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(payload.error ?? "request-failed");
        }

        const data = (await response.json()) as ChatResponseBody;
        if (!aliveRef.current) return;
        setStage(data.stage);
        setLead(data.lead);
        await appendBotMessages(data.messages);
        if (!aliveRef.current) return;
        setQuickReplies(data.quickReplies ?? []);
      } catch (requestError) {
        if (!aliveRef.current) return;
        setIsTyping(false);
        const message =
          requestError instanceof Error &&
          requestError.message !== "request-failed"
            ? requestError.message
            : "متأسفم، در پردازش درخواست مشکلی پیش آمد. لطفاً دوباره تلاش کنید.";
        setMessages((previous) => [
          ...previous,
          {
            id: uid(),
            role: "bot",
            kind: "fallback",
            text: message,
            createdAt: Date.now(),
          },
        ]);
      } finally {
        busyRef.current = false;
      }
    },
    [appendBotMessages, stage, lead]
  );

  /* --------------------------- کنترل پنل --------------------------- */
  const open = useCallback(() => {
    setIsOpen(true);
    openRef.current = true;
    setUnread(0);
    void start(false);
  }, [start]);

  const close = useCallback(() => {
    setIsOpen(false);
    openRef.current = false;
  }, []);

  const toggle = useCallback(() => {
    if (openRef.current) close();
    else open();
  }, [close, open]);

  const restart = useCallback(async () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setMessages([]);
    setQuickReplies([]);
    setStage("ask_name");
    setLead({});
    setUnread(0);
    startedRef.current = false;
    await start(true, "ask_name", {});
  }, [start]);

  return {
    messages,
    quickReplies,
    isTyping,
    isOpen,
    isBooting,
    unread,
    error,
    stage,
    lead,
    sendMessage: (text: string) => void sendMessage(text),
    open,
    close,
    toggle,
    restart: () => void restart(),
  };
}
