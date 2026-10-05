import type { ReactNode } from "react";
import { botConfig } from "@/config/bot.config";
import {
  buildFaqGroups,
  categories as faqCategories,
  faqCount,
} from "@/lib/faq-data";
import { toPersianDigits } from "@/lib/normalize";
import BrandLogo from "@/components/BrandLogo";
import ChatWidget from "@/components/ChatWidget";
import FaqExplorer from "@/components/FaqExplorer";
import OpenChatButton from "@/components/OpenChatButton";
import Reveal from "@/components/Reveal";
import {
  ArrowLeftIcon,
  BoltIcon,
  ClockIcon,
  ExternalLinkIcon,
  GridIcon,
  HeadsetIcon,
  PhoneIcon,
  ShieldIcon,
  SparkleIcon,
} from "@/components/icons";

const categories = [...faqCategories];

/** پرسش‌های پرتکرار، دسته‌بندی‌شده بر اساس موضوع */
const faqGroups = buildFaqGroups(botConfig.ui.faqPerCategory).map((group) => ({
  category: group.category,
  items: group.items.map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    source: item.source,
  })),
}));

/** مزایای کلیدی */
const FEATURES = [
  {
    icon: <BoltIcon className="h-5 w-5" />,
    title: "پاسخ فوری و هوشمند",
    description:
      "موتور جست‌وجوی فارسی با تحمل غلط‌املایی و ریشه‌یابی؛ نزدیک‌ترین پاسخ را در کسری از ثانیه پیدا می‌کند.",
  },
  {
    icon: <ShieldIcon className="h-5 w-5" />,
    title: "مبتنی بر منابع رسمی",
    description:
      "هر پاسخ همراه با پیوند به منبع رسمی ارائه می‌شود تا از صحت اطلاعات مطمئن باشید.",
  },
  {
    icon: <ClockIcon className="h-5 w-5" />,
    title: "دسترسی‌پذیر در هر زمان",
    description:
      "بدون انتظار در صف پشتیبانی؛ شبانه‌روزی و در تمام روزهای هفته در خدمت شماست.",
  },
  {
    icon: <HeadsetIcon className="h-5 w-5" />,
    title: "اتصال به کارشناس",
    description:
      "هر لحظه که بخواهید، شماره تماس و راه‌های ارتباط با کارشناسان در دسترس شماست.",
  },
];

/** گام‌های گفتگو */
const STEPS = [
  {
    step: "۱",
    title: "ثبت نام",
    description:
      "نام و نام خانوادگی خود را وارد می‌کنید تا گفتگو شخصی‌سازی شود.",
  },
  {
    step: "۲",
    title: "ثبت شماره تماس",
    description:
      "شماره همراه شما ثبت می‌شود تا در صورت نیاز کارشناسان با شما تماس بگیرند.",
  },
  {
    step: "۳",
    title: "انتخاب موضوع یا پرسش آزاد",
    description:
      "یکی از موضوعات را انتخاب می‌کنید، پرسش‌های همان موضوع را می‌بینید و پاسخ را دریافت می‌کنید.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* ------------------------- نوار اطلاع‌رسانی ------------------------- */}
      <div className="chat-gradient border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2 text-[11.5px] text-white/85 sm:px-5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 animate-soft-pulse rounded-full bg-emerald-400" />
            پاسخ‌گویی خودکار ۲۴ ساعته، ۷ روز هفته
          </span>
          <a
            href={`tel:${botConfig.contact.supportPhoneRaw}`}
            className="hidden items-center gap-1.5 font-bold text-white transition hover:text-accent-300 sm:flex"
          >
            <PhoneIcon className="h-3.5 w-3.5" />
            {botConfig.contact.supportPhone}
          </a>
        </div>
      </div>

      {/* ----------------------------- هدر ----------------------------- */}
      <header className="sticky top-0 z-30 border-b border-brand-900/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <BrandLogo
              alt={botConfig.branding.companyName}
              className="h-10 w-10 shrink-0 rounded-xl object-contain ring-1 ring-brand-900/10 sm:h-11 sm:w-11"
            />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[13.5px] font-extrabold text-brand-900 sm:text-[14.5px]">
                {botConfig.branding.companyShortName}
              </p>
              <p className="truncate text-[10.5px] text-brand-500 sm:text-[11px]">
                دستیار هوشمند پشتیبانی
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            <a
              href="#topics"
              className="rounded-xl px-3 py-2 text-[12.5px] font-bold text-brand-700 transition hover:bg-brand-50"
            >
              موضوعات
            </a>
            <a
              href="#how"
              className="rounded-xl px-3 py-2 text-[12.5px] font-bold text-brand-700 transition hover:bg-brand-50"
            >
              نحوه کار
            </a>
            <a
              href="#faq"
              className="rounded-xl px-3 py-2 text-[12.5px] font-bold text-brand-700 transition hover:bg-brand-50"
            >
              سؤالات متداول
            </a>
            <a
              href={botConfig.branding.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-bold text-brand-700 transition hover:bg-brand-50"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5" />
              وب‌سایت رسمی
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`tel:${botConfig.contact.supportPhoneRaw}`}
              aria-label="تماس تلفنی"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 text-brand-700 transition hover:bg-brand-50 sm:hidden"
            >
              <PhoneIcon className="h-4 w-4" />
            </a>
            <OpenChatButton
              label={botConfig.ui.launcherLabel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-800 px-3.5 py-2.5 text-[12.5px] font-bold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
            >
              <SparkleIcon className="h-3.5 w-3.5" />
              <span className="hidden xs:inline sm:inline">شروع گفتگو</span>
            </OpenChatButton>
          </div>
        </div>
      </header>

      {/* ----------------------------- هیرو ----------------------------- */}
      <section className="relative overflow-hidden">
        <div className="chat-gradient absolute inset-0" />
        <div className="absolute inset-0 opacity-[0.22]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 12% 18%, #46b298 0, transparent 42%), radial-gradient(circle at 88% 6%, #74c1d1 0, transparent 38%), radial-gradient(circle at 60% 100%, #1a8298 0, transparent 46%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse at 50% 0%, #000 35%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at 50% 0%, #000 35%, transparent 75%)",
            }}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="aurora-blob left-[-12%] top-[-18%] h-72 w-72 animate-aurora bg-accent-500/25" />
          <span className="aurora-blob right-[-10%] top-[6%] h-80 w-80 animate-aurora bg-brand-400/30 [animation-delay:-6s]" />
          <span className="aurora-blob bottom-[-28%] left-[28%] h-72 w-72 animate-aurora bg-accent-400/20 [animation-delay:-12s]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
            <Reveal className="text-center text-white lg:text-right">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11.5px] font-bold text-white/90 ring-1 ring-white/20 backdrop-blur">
                <span className="inline-block h-1.5 w-1.5 animate-soft-pulse rounded-full bg-emerald-400" />
                دستیار هوشمند، فعال و آماده پاسخ‌گویی
              </span>

              <h1 className="mt-5 text-[27px] font-extrabold leading-[1.55] sm:text-[36px] sm:leading-[1.5] lg:text-[42px] lg:leading-[1.45]">
                پاسخ‌گوی هوشمند
                <span className="text-gradient-accent"> مرکز مبادله ارز و طلا </span>
                ایران
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-[13.5px] leading-8 text-white/80 sm:text-[14.5px] lg:mx-0">
                پاسخ فوری و دقیق به پرتکرارترین پرسش‌ها درباره حراج سکه طلا،
                سامانه ارز تجاری، بازار متشکل ارز ایران، ارز اربعین، ارز دانشجویی
                و خدمات پشتیبانی — همراه با ارجاع به منابع رسمی.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
                <OpenChatButton
                  label={botConfig.ui.launcherLabel}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-500 px-6 py-4 text-[14px] font-extrabold text-brand-950 shadow-lg transition hover:bg-accent-400 active:scale-95 sm:w-auto sm:py-3.5"
                >
                  <SparkleIcon className="h-4 w-4" />
                  شروع گفتگو با دستیار
                </OpenChatButton>
                <a
                  href={`tel:${botConfig.contact.supportPhoneRaw}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-[13.5px] font-bold text-white backdrop-blur transition hover:bg-white/20 sm:w-auto sm:py-3.5"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {botConfig.contact.supportPhone}
                </a>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11.5px] font-semibold text-white/70 lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <ShieldIcon className="h-3.5 w-3.5 text-accent-300" />
                  مبتنی بر منابع رسمی
                </span>
                <span className="flex items-center gap-1.5">
                  <BoltIcon className="h-3.5 w-3.5 text-accent-300" />
                  پاسخ در چند ثانیه
                </span>
                <span className="flex items-center gap-1.5">
                  <HeadsetIcon className="h-3.5 w-3.5 text-accent-300" />
                  ارجاع به کارشناس
                </span>
              </div>
            </Reveal>

            <Reveal delay={180}>
              <PreviewCard />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ----------------------------- آمار ----------------------------- */}
      <section className="relative z-10 -mt-10 px-4 sm:-mt-12 sm:px-5">
        <Reveal>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-2 rounded-3xl border border-brand-900/10 bg-white p-4 shadow-panel sm:grid-cols-4 sm:gap-3 sm:p-5">
            <Stat value={`${toPersianDigits(faqCount)}+`} label="پرسش متداول" />
            <Stat
              value={toPersianDigits(categories.length)}
              label="موضوع دسته‌بندی‌شده"
            />
            <Stat value="۲۴/۷" label="پاسخ‌گویی خودکار" />
            <Stat value="۱۰۰٪" label="مبتنی بر منابع رسمی" />
          </div>
        </Reveal>
      </section>

      {/* --------------------------- موضوعات --------------------------- */}
      <section id="topics" className="scroll-mt-24 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <SectionTitle
            title="موضوعات پوشش‌داده‌شده"
            subtitle="روی هر موضوع بزنید تا گفتگو با همان موضوع باز شود؛ یا سؤال خود را آزادانه در چت بنویسید."
          />

          <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Reveal key={category} delay={index * 70}>
                <OpenChatButton
                  message={category}
                  label={category}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-4 text-right shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift active:translate-y-0"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors duration-300 group-hover:bg-brand-700 group-hover:text-white">
                      <GridIcon className="h-5 w-5" />
                    </span>
                    <span className="truncate text-[13.5px] font-bold text-brand-900">
                      {category}
                    </span>
                  </span>
                  <ArrowLeftIcon className="h-4 w-4 shrink-0 text-brand-300 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-accent-600" />
                </OpenChatButton>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- مزایا ---------------------------- */}
      <section className="bg-slate-50 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <Reveal key={feature.title} delay={index * 80} className="h-full">
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- مراحل کار --------------------------- */}
      <section id="how" className="scroll-mt-24 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <SectionTitle
            title="گفتگو در سه گام ساده"
            subtitle="در کمتر از یک دقیقه به پاسخ سؤال خود می‌رسید."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {STEPS.map((item, index) => (
              <Reveal key={item.title} delay={index * 100} className="h-full">
                <StepCard
                  step={item.step}
                  title={item.title}
                  description={item.description}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------ سؤالات متداول ------------------------ */}
      <section id="faq" className="scroll-mt-24 bg-slate-50 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-5">
          <SectionTitle
            title="پرسش‌های پرتکرار به تفکیک موضوع"
            subtitle="برای هر موضوع، پرتکرارترین پرسش‌ها را یک‌جا ببینید. برای دیدن پاسخ، روی هر پرسش بزنید."
          />
          <Reveal className="mt-9">
            <FaqExplorer
              groups={faqGroups}
              sourceLabel={botConfig.ui.sourceLabel}
              chatCtaLabel={botConfig.ui.faqChatCta}
            />
          </Reveal>
        </div>
      </section>

      {/* --------------------------- فراخوان --------------------------- */}
      <section className="bg-white px-4 py-14 sm:px-5 sm:py-16">
        <Reveal className="mx-auto max-w-6xl">
          <div className="chat-gradient relative overflow-hidden rounded-3xl px-5 py-12 text-center text-white sm:px-12">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 88% 12%, #46b298 0, transparent 45%), radial-gradient(circle at 6% 92%, #74c1d1 0, transparent 42%)",
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-white/90 ring-1 ring-white/20">
                <HeadsetIcon className="h-3.5 w-3.5" />
                پشتیبانی در دسترس شماست
              </span>
              <h2 className="mt-5 text-[21px] font-extrabold leading-relaxed sm:text-[27px]">
                آماده پاسخ‌گویی به سؤال شما هستیم
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-8 text-white/80 sm:text-[13.5px]">
                برای گفتگوی سریع با دستیار هوشمند روی دکمه زیر بزنید، یا برای
                ارتباط مستقیم با کارشناسان ما با شماره پشتیبانی تماس بگیرید.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <OpenChatButton
                  label={botConfig.ui.launcherLabel}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-500 px-6 py-4 text-[14px] font-extrabold text-brand-950 shadow-lg transition hover:bg-accent-400 active:scale-95 sm:py-3.5"
                >
                  <SparkleIcon className="h-4 w-4" />
                  شروع گفتگو
                </OpenChatButton>
                <a
                  href={`tel:${botConfig.contact.supportPhoneRaw}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-[13.5px] font-bold text-white backdrop-blur transition hover:bg-white/20 sm:py-3.5"
                >
                  <PhoneIcon className="h-4 w-4" />
                  {botConfig.contact.supportPhone}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ----------------------------- فوتر ----------------------------- */}
      <footer className="border-t border-brand-900/10 bg-slate-50 pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <BrandLogo
                  alt={botConfig.branding.companyName}
                  className="h-11 w-11 rounded-xl object-contain ring-1 ring-brand-900/10"
                />
                <div className="leading-tight">
                  <p className="text-[13.5px] font-extrabold text-brand-900">
                    {botConfig.branding.companyName}
                  </p>
                  <p className="text-[11px] text-brand-500">
                    {botConfig.branding.botName}
                  </p>
                </div>
              </div>
              <p className="mt-4 max-w-md text-[12px] leading-7 text-brand-500">
                پاسخ‌ها بر اساس آخرین نسخهٔ پرسش‌های متداول رسمی سازمان ارائه
                می‌شود و برای هر پاسخ، پیوند به منبع درج می‌گردد.
              </p>
            </div>

            <div>
              <p className="text-[12.5px] font-extrabold text-brand-900">موضوعات</p>
              <ul className="mt-3 space-y-2.5">
                {categories.slice(0, 4).map((category) => (
                  <li key={category}>
                    <OpenChatButton
                      message={category}
                      label={category}
                      className="text-right text-[12px] text-brand-500 transition hover:text-brand-800"
                    >
                      {category}
                    </OpenChatButton>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[12.5px] font-extrabold text-brand-900">
                ارتباط با ما
              </p>
              <ul className="mt-3 space-y-2.5 text-[12px] text-brand-500">
                <li className="flex items-center gap-2">
                  <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                  <a
                    href={`tel:${botConfig.contact.supportPhoneRaw}`}
                    className="transition hover:text-brand-800"
                  >
                    {botConfig.contact.supportPhone}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <ClockIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                  {botConfig.contact.workingHours}
                </li>
                <li className="flex items-center gap-2">
                  <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                  <a
                    href={botConfig.branding.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition hover:text-brand-800"
                  >
                    وب‌سایت رسمی
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <BoltIcon className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                  پاسخ‌گویی خودکار ۲۴ ساعته
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-brand-900/10 py-6 text-center sm:flex-row sm:text-right">
            <p className="text-[11.5px] text-brand-400">
              {botConfig.branding.companyName} — تمامی حقوق محفوظ است.
            </p>
            <a
              href="#topics"
              className="text-[11.5px] text-brand-400 transition hover:text-brand-700"
            >
              بازگشت به بالای صفحه ↑
            </a>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </main>
  );
}

/* --------------------------- کامپوننت‌های کمکی --------------------------- */

function PreviewCard() {
  const previewTopics = categories.slice(0, 3);
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-accent-400/25 to-brand-400/20 blur-2xl" />
      <div className="relative rounded-3xl border border-white/15 bg-white/10 p-3 shadow-panel backdrop-blur-lg sm:p-4">
        <div className="overflow-hidden rounded-2xl bg-white">
          {/* هدر پیش‌نمایش */}
          <div className="chat-gradient flex items-center gap-2.5 px-3.5 py-3">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25">
              <BrandLogo alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 leading-tight text-white">
              <p className="truncate text-[12.5px] font-extrabold">
                {botConfig.ui.panelTitle}
              </p>
              <p className="flex items-center gap-1 text-[10px] text-white/75">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                آنلاین — پاسخ فوری
              </p>
            </div>
          </div>

          <div className="space-y-2.5 bg-gradient-to-b from-slate-50 to-white p-3.5">
            <div className="max-w-[88%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-[11.5px] leading-6 text-brand-900 ring-1 ring-slate-200">
              سلام! 👋 لطفاً نام و نام خانوادگی خود را وارد کنید.
            </div>
            <div className="ml-auto max-w-[70%] rounded-2xl rounded-bl-md bg-brand-700 px-3 py-2 text-[11.5px] font-semibold text-white">
              عبداله عبدی
            </div>
            <div className="max-w-[88%] rounded-2xl rounded-br-md bg-white px-3 py-2 text-[11.5px] leading-6 text-brand-900 ring-1 ring-slate-200">
              ممنون عبداله عزیز 🌟 شماره تماس خود را وارد کنید.
            </div>
            <div className="ml-auto max-w-[60%] rounded-2xl rounded-bl-md bg-brand-700 px-3 py-2 text-[11.5px] font-semibold text-white">
              ۰۹۱۲۳۴۵۶۷۸۹
            </div>
            <div className="max-w-[90%] rounded-2xl rounded-br-md border border-brand-200 bg-brand-50/70 px-3 py-2 text-[11.5px] leading-6 text-brand-900">
              چطور می‌توانم کمکتان کنم؟ یکی از موضوعات زیر را انتخاب کنید 👇
            </div>
            <div className="space-y-1.5">
              {previewTopics.map((topic, index) => (
                <div
                  key={topic}
                  className="flex items-center gap-2 rounded-xl border border-brand-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-900 shadow-sm"
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-brand-700 text-[9px] font-extrabold text-white">
                    {["۱", "۲", "۳"][index]}
                  </span>
                  <span className="truncate">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl px-2 py-3 text-center transition hover:bg-brand-50/60">
      <p className="bg-gradient-to-b from-brand-700 to-brand-900 bg-clip-text text-[21px] font-extrabold text-transparent sm:text-[25px]">
        {value}
      </p>
      <p className="mt-1 text-[11.5px] font-semibold text-brand-500">{label}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto mb-4 block h-1 w-12 origin-right animate-grow-line rounded-full bg-gradient-to-r from-accent-500 to-accent-300" />
      <h2 className="text-[21px] font-extrabold leading-relaxed text-brand-900 sm:text-[26px]">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-[12.5px] leading-7 text-brand-500 sm:text-[13px]">
        {subtitle}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-brand-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-panel sm:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 ring-1 ring-brand-100 transition group-hover:from-brand-700 group-hover:to-brand-900 group-hover:text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-[14.5px] font-extrabold text-brand-900">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-7 text-brand-500">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-brand-900/10 bg-slate-50 p-6 pt-8 transition hover:border-brand-200 hover:bg-white hover:shadow-panel">
      <span className="absolute -top-3.5 right-6 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-[13px] font-extrabold text-brand-950 shadow-md ring-2 ring-white">
        {step}
      </span>
      <h3 className="text-[14.5px] font-extrabold text-brand-900">{title}</h3>
      <p className="mt-2 text-[12.5px] leading-7 text-brand-500">{description}</p>
    </div>
  );
}
