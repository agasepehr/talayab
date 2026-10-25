"use client";

import { useState } from "react";
import Link from "next/link";

/* =========================
   Small icon helper
========================== */
function Icon({
  d,
  className = "h-6 w-6",
}: {
  d: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  tag: "M3 12V4h8l10 10-8 8L3 12zM7.5 8.5h.01",
  gem: "M6 3h12l4 6-10 12L2 9l4-6zM2 9h20M12 21L8 9l4-6 4 6-4 12",
  chat: "M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4",
  store:
    "M4 9l1-5h14l1 5M4 9v11h16V9M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0M9 20v-6h6v6",
  arrow: "M19 12H5M11 6l-6 6 6 6",
};

/* =========================
   Page content
========================== */
const features = [
  {
    icon: ICONS.tag,
    title: "قیمت‌ها کنار هم",
    text: "قیمت و مشخصات محصولات طلا را بدون رفت‌وآمد بین فروشگاه‌ها ببین.",
  },
  {
    icon: ICONS.gem,
    title: "جزئیات کامل محصول",
    text: "وزن، عیار و توضیحات هر محصول را در یک نگاه داشته باش.",
  },
  {
    icon: ICONS.chat,
    title: "ارتباط مستقیم با فروشگاه",
    text: "بعد از انتخاب، مستقیم با فروشنده در ارتباط باش.",
  },
  {
    icon: ICONS.shield,
    title: "انتخاب آگاهانه",
    text: "با اطلاعات شفاف تصمیم بگیر، نه با حدس و گمان.",
  },
];

const steps = [
  {
    title: "جستجو کن",
    text: "طلای مورد نظرت را در بخش طلاها پیدا کن.",
  },
  {
    title: "مقایسه کن",
    text: "قیمت، وزن و عیار محصولات فروشگاه‌های مختلف را کنار هم ببین.",
  },
  {
    title: "با فروشگاه در ارتباط باش",
    text: "فروشگاه مناسب را انتخاب کن و مستقیم با آن تماس بگیر.",
  },
];

const tips = [
  {
    title: "عیار را بپرس",
    text: "عیار نشان‌دهنده خلوص طلاست. مثلاً طلای ۱۸ عیار حدود ۷۵٪ طلای خالص دارد.",
  },
  {
    title: "وزن و قیمت را جدا ببین",
    text: "قیمت نهایی فقط قیمت هر گرم نیست. وزن دقیق محصول و هزینه‌های ساخت هم در آن اثر دارند.",
  },
  {
    title: "فاکتور بگیر",
    text: "فاکتور خرید با مشخصات کامل محصول، مدرک اصالت و پشتوانه توست.",
  },
  {
    title: "چند فروشگاه را مقایسه کن",
    text: "قیمت و شرایط چند فروشنده را ببین و بعد تصمیم بگیر.",
  },
];

export default function Home() {
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white">

      {/* =========================
          HERO
      ========================== */}
      <section className="relative min-h-[620px] w-full overflow-hidden md:aspect-[16/9] md:min-h-0">

        {/* Background */}
        <img
          src="/hero-luxury.jpg"
          alt="TheTala"
          className="absolute inset-0 h-full w-full object-cover object-[75%_center] md:object-center"
        />

        {/* Mobile readability overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/60 to-white/10 md:hidden" />

        {/* =========================
            Header
        ========================== */}
        <header className="absolute left-4 right-4 top-4 z-20 flex items-center md:left-[6%] md:right-[6%] md:top-[5%]">

          {/* Logo */}
          <div className="shrink-0 md:w-[14%]">
            <div
              dir="rtl"
              className="text-2xl font-extrabold tracking-tight text-[#073b31] md:text-[2vw]"
            >
              TheTala
            </div>
          </div>

          <div className="flex-1" />

          {/* Menu (desktop) */}
          <nav
            dir="rtl"
            className="hidden gap-[2.4vw] text-[1.1vw] font-medium text-[#073b31] md:flex"
          >
            <a
              href="/"
              className="relative"
            >
              خانه

              <span className="absolute -bottom-3 left-1/2 h-[2px] w-full -translate-x-1/2 bg-[#b8893d]" />
            </a>

            <Link
              href="/shops"
              className="transition hover:text-[#b8893d]"
            >
              فروشگاه‌ها
            </Link>

            <a
              href="/gold"
              className="transition hover:text-[#b8893d]"
            >
              طلاها
            </a>

            <a
              href="/#about"
              className="transition hover:text-[#b8893d]"
            >
              درباره ما
            </a>
          </nav>

          {/* Account */}
          <div dir="rtl" className="relative z-30 flex shrink-0 items-center gap-2 whitespace-nowrap text-[13px] font-bold md:mr-[2vw] md:gap-[0.7vw] md:text-[0.95vw]">
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#073b31]/20 bg-white/80 px-3 py-1.5 text-[#073b31] backdrop-blur transition hover:border-[#b8893d] hover:text-[#b8893d] md:px-[1.1vw] md:py-[0.55vw]"
            >
              ورود
            </Link>
            <Link
              href="/register"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#073b31] px-3 py-1.5 text-white transition hover:bg-[#0a4a3c] md:px-[1.2vw] md:py-[0.58vw]"
            >
              عضویت
            </Link>
          </div>

          {/* Icons */}
          <div className="mr-3 flex items-center gap-3 md:mr-[2.2vw] md:gap-[2vw]">

            {/* Search (desktop) */}
            <Link
              href="/gold"
              aria-label="جستجوی طلا"
              className="hidden text-[#073b31] transition hover:text-[#b8893d] md:block"
            >
              <svg
                className="w-[1.7vw]"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="2"
                />

                <path
                  d="M15 15L21 21"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label="منو"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="flex h-9 w-9 flex-col items-center justify-center gap-1 md:hidden"
            >
              {open ? (
                <svg className="w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="#073b31"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <>
                  <span className="h-[2px] w-5 bg-[#073b31]" />
                  <span className="h-[2px] w-5 bg-[#073b31]" />
                  <span className="h-[2px] w-5 bg-[#073b31]" />
                </>
              )}
            </button>

          </div>

          {/* Mobile menu panel */}
          {open && (
            <div
              dir="rtl"
              className="absolute left-0 right-0 top-full z-40 mt-3 rounded-2xl border border-[#073b31]/10 bg-white/95 p-3 shadow-xl backdrop-blur md:hidden"
            >
              <nav className="flex flex-col text-base font-medium text-[#073b31]">
                <a
                  href="/"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 transition hover:bg-[#F7FAF8]"
                >
                  خانه
                </a>
                <Link
                  href="/shops"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 transition hover:bg-[#F7FAF8]"
                >
                  فروشگاه‌ها
                </Link>
                <a
                  href="/gold"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 transition hover:bg-[#F7FAF8]"
                >
                  طلاها
                </a>
                <a
                  href="/#about"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 transition hover:bg-[#F7FAF8]"
                >
                  درباره ما
                </a>
              </nav>
            </div>
          )}
        </header>

        {/* =========================
            Hero Text
        ========================== */}
        <div
          dir="rtl"
          className="absolute left-[7%] right-[7%] top-[26%] z-10 md:right-auto md:left-[10%] md:top-[28%] md:w-[38%]"
        >

          {/* THETALA */}
          <div
            dir="ltr"
            className="mb-4 flex items-center gap-3 text-[10px] tracking-[0.4em] text-[#073b31] md:mb-[4%] md:gap-5 md:text-[1vw] md:tracking-[0.5em]"
          >
            <span>T H E T A L A</span>

            <span className="h-[1px] w-12 bg-[#b8893d] md:w-20" />
          </div>

          {/* Main Heading */}
          <h1 className="leading-[1.3]">

            <span className="block whitespace-nowrap text-[28px] font-bold text-[#073b31] sm:text-[34px] md:text-[3.6vw]">
              طلا رو مقایسه کن،
            </span>

            <span className="block whitespace-nowrap text-[28px] font-bold text-[#b8893d] sm:text-[34px] md:text-[3.7vw]">
              مطمئن انتخاب کن
            </span>

          </h1>

          {/* CTA */}
          <Link
            href="/gold"
            className="group mt-8 inline-flex w-fit items-center gap-3 rounded-full bg-[#063b30] py-1.5 pl-1.5 pr-6 text-base font-bold text-white shadow-lg shadow-[#063b30]/25 transition hover:bg-[#0a4a3c] md:mt-[3.5vw] md:gap-[1.2vw] md:py-[0.55vw] md:pl-[0.55vw] md:pr-[2.4vw] md:text-[1.3vw]"
          >
            <span>
              مقایسه طلاها
            </span>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d3a85a] text-[#063b30] transition-transform duration-300 group-hover:-translate-x-1 md:h-[2.8vw] md:w-[2.8vw]">
              <svg
                className="w-5 md:w-[1.3vw]"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M19 12H5M11 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>

        </div>

      </section>


      {/* =========================
          Features strip
      ========================== */}
      <section dir="rtl" className="bg-white px-5 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-[#E7EEE9] bg-white p-6 transition hover:border-[#b8893d]/50 hover:shadow-lg hover:shadow-[#073b31]/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7FAF8] text-[#b8893d]">
                  <Icon d={item.icon} />
                </div>
                <h3 className="mt-5 text-lg font-extrabold text-[#073b31]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-[#52665E]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* =========================
          Entry cards: gold + shops
      ========================== */}
      <section dir="rtl" className="bg-[#F7FAF8] px-5 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-sm font-semibold text-[#b8893d]">شروع کن</div>
          <h2 className="mt-2 text-2xl font-extrabold text-[#073b31] md:text-4xl">
            از کجا شروع کنیم؟
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2">

            <Link
              href="/gold"
              className="group relative overflow-hidden rounded-3xl bg-[#073b31] p-8 text-white transition hover:bg-[#0a4a3c] md:p-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#d3a85a]">
                <Icon d={ICONS.gem} className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-extrabold">طلاها</h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-white/80">
                محصولات طلا را جستجو کن و قیمت و مشخصات آن‌ها را مقایسه کن.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#d3a85a]">
                مشاهده طلاها
                <Icon
                  d={ICONS.arrow}
                  className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
                />
              </span>
            </Link>

            <Link
              href="/shops"
              className="group relative overflow-hidden rounded-3xl border border-[#E7EEE9] bg-white p-8 transition hover:border-[#b8893d]/50 hover:shadow-lg hover:shadow-[#073b31]/5 md:p-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7FAF8] text-[#b8893d]">
                <Icon d={ICONS.store} className="h-7 w-7" />
              </div>
              <h3 className="mt-6 text-2xl font-extrabold text-[#073b31]">
                فروشگاه‌ها
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-7 text-[#52665E]">
                فروشگاه‌های طلا را ببین و مستقیم با آن‌ها در ارتباط باش.
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#b8893d]">
                مشاهده فروشگاه‌ها
                <Icon
                  d={ICONS.arrow}
                  className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1"
                />
              </span>
            </Link>

          </div>
        </div>
      </section>


      {/* =========================
          How it works
      ========================== */}
      <section dir="rtl" className="bg-white px-5 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-sm font-semibold text-[#b8893d]">ساده و سریع</div>
          <h2 className="mt-2 text-2xl font-extrabold text-[#073b31] md:text-4xl">
            چطور کار می‌کند؟
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#b8893d]/40 bg-[#F7FAF8] text-lg font-extrabold text-[#b8893d]">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#073b31]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#52665E]">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* =========================
          Buying tips
      ========================== */}
      <section dir="rtl" className="bg-[#F7FAF8] px-5 py-14 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-sm font-semibold text-[#b8893d]">راهنمای خرید</div>
          <h2 className="mt-2 text-2xl font-extrabold text-[#073b31] md:text-4xl">
            قبل از خرید طلا، این ۴ نکته را بدان
          </h2>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {tips.map((tip, i) => (
              <div
                key={tip.title}
                className="flex items-start gap-4 rounded-3xl border border-[#E7EEE9] bg-white p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#073b31] text-sm font-extrabold text-[#d3a85a]">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#073b31]">
                    {tip.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[#52665E]">
                    {tip.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* =========================
          Seller call to action
      ========================== */}
      <section dir="rtl" className="bg-white px-5 py-14 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl bg-[#073b31] p-8 text-white md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-2xl font-extrabold md:text-3xl">
              فروشگاه طلا دارید؟
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/80">
              محصولات و فروشگاه خود را به خریداران نشان دهید و مستقیم با آن‌ها در ارتباط باشید.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#d3a85a] px-8 py-3 text-sm font-bold text-[#063b30] transition hover:bg-[#e0b86c]"
          >
            ثبت‌نام فروشگاه
          </Link>
        </div>
      </section>


      {/* =========================
          About (compact) + footer
      ========================== */}
      <section id="about" dir="rtl" className="border-t border-[#E7EEE9] bg-[#F7FAF8] px-5 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-extrabold text-[#073B31]">درباره TheTala</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#52665E]">
            TheTala برای پیدا کردن، مقایسه و بررسی قیمت محصولات طلا ساخته شده است؛
            تا انتخاب بین فروشگاه‌ها و محصولات، شفاف‌تر و آگاهانه‌تر باشد.
          </p>
        </div>
      </section>

      <footer dir="rtl" className="bg-[#073b31] px-5 py-8 text-white/80">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-sm md:flex-row md:items-center">
          <div className="font-extrabold text-white">TheTala</div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="transition hover:text-[#d3a85a]">خانه</Link>
            <Link href="/shops" className="transition hover:text-[#d3a85a]">فروشگاه‌ها</Link>
            <Link href="/gold" className="transition hover:text-[#d3a85a]">طلاها</Link>
            <Link href="/login" className="transition hover:text-[#d3a85a]">ورود</Link>
            <Link href="/register" className="transition hover:text-[#d3a85a]">عضویت</Link>
          </nav>
          <div className="text-xs text-white/60">© TheTala</div>
        </div>
      </footer>

    </main>
  );
}
