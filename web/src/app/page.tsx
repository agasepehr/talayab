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
          alt="طلایاب"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* =========================
            Header
        ========================== */}
        <header className="absolute left-[6%] right-[6%] top-[5%] z-20 flex items-center">

          {/* Logo */}
          <div className="w-[14%] shrink-0">
            <img
              src="/logo.png"
              alt="Talayab"
              className="w-full"
            />
          </div>

          {/* Menu */}
          <nav
            dir="rtl"
            className="ml-[3%] flex gap-[2.4vw] text-[1.1vw] font-medium text-[#073b31]"
          >
            <a
              href="#"
              className="transition hover:text-[#b8893d]"
            >
              درباره ما
            </a>

            <a
              href="#"
              className="transition hover:text-[#b8893d]"
            >
              مجله
            </a>

            <a
              href="#"
              className="transition hover:text-[#b8893d]"
            >
              فروشگاه‌ها
            </a>

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

          {/* Space */}
          <div className="flex-1" />

          {/* Icons */}
          <div className="flex items-center gap-[2vw]">

            {/* Search */}
            <button
              type="button"
              aria-label="جستجو"
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
            </button>

            {/* Hamburger */}
            <button
              type="button"
              aria-label="منو"
              className="flex flex-col gap-1"
            >
              <span className="h-[2px] w-[2vw] bg-[#073b31]" />
              <span className="h-[2px] w-[2vw] bg-[#073b31]" />
              <span className="h-[2px] w-[2vw] bg-[#073b31]" />
            </button>

          </div>
        </header>

        {/* =========================
            Hero Text
        ========================== */}
        <div
          dir="rtl"
          className="absolute left-[10%] top-[24%] z-10 w-[38%]"
        >

          {/* TALAYAB */}
          <div
            dir="ltr"
            className="mb-[4%] flex items-center gap-5 text-[1vw] tracking-[0.5em] text-[#073b31]"
          >
            <span>T A L A Y A B</span>

            <span className="h-[1px] w-20 bg-[#b8893d]" />
          </div>

          {/* Main Heading */}
          <h1 className="leading-[1.2]">

            <span className="block text-[4vw] font-bold text-[#073b31]">
              طلای درست،
            </span>

            <span className="block text-[4.2vw] font-bold text-[#b8893d]">
              پیدا می‌شه.
            </span>

          </h1>

          {/* Description */}
          <p className="mt-[5%] text-[1.2vw] leading-[2] text-[#183f36]">
            طلاها را ببین، قیمت‌ها را مقایسه کن
            <br />
            و آگاهانه انتخاب کن.
          </p>

          {/* CTA */}
          <button
            type="button"
            className="mt-[5%] flex w-[55%] items-center justify-between rounded-full bg-[#063b30] px-[5%] py-[3%] text-[1.2vw] text-white transition hover:bg-[#0a4a3c]"
          >
            <span>
              کشف طلاها
            </span>

            <span className="text-[#d3a85a]">
              ←
            </span>
          </button>

        </div>

      </section>

    </main>
  );
}