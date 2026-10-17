import Link from "next/link";

"use client";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* =========================
          HERO
      ========================== */}
      <section className="relative aspect-[16/9] w-full overflow-hidden">

        {/* Background */}
        <img
          src="/hero-luxury.jpg"
          alt="TheTala"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* =========================
            Header
        ========================== */}
        <header className="absolute left-[6%] right-[6%] top-[5%] z-20 flex items-center">

          {/* Logo */}
          <div className="w-[14%] shrink-0">
            <div
              dir="rtl"
              className="text-[2vw] font-extrabold tracking-tight text-[#073b31]"
            >
              TheTala
            </div>
          </div>

          <div className="hidden flex-1 md:block" />

          {/* Menu */}
          <nav
            dir="rtl"
            className="hidden gap-[2.4vw] text-[1.1vw] font-medium text-[#073b31] md:flex"
          >
            <a
              href="/#about"
              className="transition hover:text-[#b8893d]"
            >
              درباره ما
            </a>

            <a
              href="/#magazine"
              className="transition hover:text-[#b8893d]"
            >
              مجله
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
              href="/"
              className="relative"
            >
              خانه

              <span className="absolute -bottom-3 left-1/2 h-[2px] w-full -translate-x-1/2 bg-[#b8893d]" />
            </a>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4 md:gap-[2vw]">

            {/* Search */}
            <Link
              href="/gold"
              aria-label="جستجوی طلا"
              className="text-[#073b31] transition hover:text-[#b8893d]"
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

            {/* Mobile menu */}

            <Link
              href="/shops"
              aria-label="فروشگاه‌ها"
              className="flex flex-col gap-1 md:hidden"
            >
              <span className="h-[2px] w-5 bg-[#073b31]" />
              <span className="h-[2px] w-5 bg-[#073b31]" />
              <span className="h-[2px] w-5 bg-[#073b31]" />
            </Link>

          </div>
        </header>

        {/* =========================
            Hero Text
        ========================== */}
        <div
          dir="rtl"
          className="absolute left-[10%] top-[24%] z-10 w-[38%]"
        >

          {/* THETALA */}
          <div
            dir="ltr"
            className="mb-[4%] flex items-center gap-5 text-[1vw] tracking-[0.5em] text-[#073b31]"
          >
            <span>T H E T A L A</span>

            <span className="h-[1px] w-20 bg-[#b8893d]" />
          </div>

          {/* Main Heading */}
          <h1 className="leading-[1.2]">

            <span className="block text-[4vw] font-bold text-[#073b31]">
              طلای خوب
            </span>

            <span className="block text-[4.2vw] font-bold text-[#b8893d]">
              پیدا می‌شه
            </span>

          </h1>

          {/* Description */}
          <p className="mt-[5%] text-[1.2vw] leading-[2] text-[#183f36]">
            طلاها را ببین، قیمت‌ها را مقایسه کن
            <br />
            و آگاهانه انتخاب کن.
          </p>

          {/* CTA */}
          <Link
            href="/gold"
            className="mt-[5%] flex w-[55%] items-center justify-between rounded-full bg-[#063b30] px-[5%] py-[3%] text-[1.2vw] text-white transition hover:bg-[#0a4a3c]"
          >
            <span>
              مشاهده طلاها
            </span>

            <span className="text-[#d3a85a]">
              ←
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