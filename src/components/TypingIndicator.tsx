import { botConfig } from "@/config/bot.config";
import BrandLogo from "./BrandLogo";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-up">
      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brand-900 ring-1 ring-brand-700/40">
        <BrandLogo alt={botConfig.branding.botName} className="h-full w-full object-cover" />
      </div>
      <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-bubble">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand-400 animate-dot-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-brand-400 animate-dot-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-brand-400 animate-dot-bounce" />
        </div>
      </div>
    </div>
  );
}
