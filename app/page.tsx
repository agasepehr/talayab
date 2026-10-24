"use client";

import { useState } from "react";
import Link from "next/link";

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


      <section id="about" dir="rtl" className="border-t border-[#E7EEE9] bg-[#F7FAF8] px-[8%] py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-sm font-semibold tracking-wide text-[#B8893D]">THETALA</div>
          <h2 className="mt-3 text-3xl font-extrabold text-[#073B31]">درباره TheTala</h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#52665E]">
            TheTala برای پیدا کردن، مقایسه و بررسی قیمت محصولات طلا ساخته شده است؛
            تا انتخاب بین فروشگاه‌ها و محصولات، شفاف‌تر و آگاهانه‌تر باشد.
          </p>
        </div>
      </section>

      <section id="magazine" dir="rtl" className="bg-white px-[8%] py-20">
        <div className="mx-auto max-w-5xl rounded-[28px] border border-[#E7EEE9] bg-[#F7FAF8] p-8 md:p-12">
          <div className="text-sm font-semibold tracking-wide text-[#B8893D]">MAGAZINE</div>
          <h2 className="mt-3 text-3xl font-extrabold text-[#073B31]">مجله TheTala</h2>
          <p className="mt-5 text-base leading-8 text-[#52665E]">
            محتوای آموزشی و راهنمای خرید طلا در این بخش منتشر خواهد شد.
          </p>
        </div>
      </section>

    </main>
  );
}
