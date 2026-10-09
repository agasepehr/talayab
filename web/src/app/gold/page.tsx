"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { trackEvent } from "../../lib/analytics";

type RawProduct = {
  id: number;
  shop_id: number;
  category_id: number | null;
  title: string | null;
  weight: number | null;
  karat: number | null;
  wage_type: string | null;
  wage_value: number | null;
  profit_percent: number | null;
  extra_fee: number | null;
  image: string | null;
};

type CatalogProduct = {
  id: number;
  title: string;
  category: string;
  weight: string;
  karat: string;
  wage: string;
  price: string;
  shop: string;
  city: string;
  image: string;
  shopId: number;
};

const categories = [
  "همه",
  "انگشتر",
  "گردنبند",
  "دستبند",
  "گوشواره",
];

function formatToman(value: number) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

function calculatePrice(product: RawProduct, gold18Price: number) {
  const weight = Number(product.weight ?? 0);
  const goldValue = weight * gold18Price;
  const wage =
    product.wage_type === "percent"
      ? goldValue * (Number(product.wage_value ?? 0) / 100)
      : Number(product.wage_value ?? 0);
  const profit =
    (goldValue + wage) *
    (Number(product.profit_percent ?? 0) / 100);
  const extra = Number(product.extra_fee ?? 0);

  return goldValue + wage + profit + extra;
}

export default function GoldPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("همه");
  const [sort, setSort] = useState("جدیدترین");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setErrorMessage("");

      const [productsResult, categoriesResult, marketResult] =
        await Promise.all([
          supabase
            .from("products")
            .select(
              "id, shop_id, category_id, title, weight, karat, wage_type, wage_value, profit_percent, extra_fee, image"
            )
            .eq("status", "active")
            .order("id", { ascending: false }),
          supabase.from("categories").select("id, name"),
          supabase
            .from("market_prices")
            .select("gold18")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      if (
        productsResult.error ||
        categoriesResult.error ||
        marketResult.error
      ) {
        if (!cancelled) {
          setErrorMessage("دریافت فهرست طلاها ناموفق بود.");
          setLoading(false);
        }
        return;
      }

      const rawProducts = (productsResult.data ?? []) as RawProduct[];
      const categoryMap = new Map<number, string>();

      (categoriesResult.data ?? []).forEach((item) => {
        categoryMap.set(item.id, item.name);
      });

      const shopIds = [...new Set(rawProducts.map((item) => item.shop_id))];
      const shopMap = new Map<
        number,
        { shop_name: string | null; city: string | null }
      >();

      if (shopIds.length) {
        const { data: shopRows } = await supabase
          .from("shops___")
          .select("id, shop_name, city")
          .in("id", shopIds);

        (shopRows ?? []).forEach((shop) => {
          shopMap.set(shop.id, shop);
        });
      }

      const gold18 = Number(marketResult.data?.gold18 ?? 0);

      const mapped = rawProducts.map((product) => {
        const shop = shopMap.get(product.shop_id);

        return {
          id: product.id,
          title: product.title ?? "محصول طلا",
          category: categoryMap.get(product.category_id ?? 0) ?? "سایر",
          weight: `${Number(product.weight ?? 0).toLocaleString("fa-IR")} گرم`,
          karat: `${Number(product.karat ?? 18).toLocaleString("fa-IR")} عیار`,
          wage:
            product.wage_type === "percent"
              ? `${Number(product.wage_value ?? 0).toLocaleString("fa-IR")}٪`
              : formatToman(Number(product.wage_value ?? 0)),
          price: formatToman(calculatePrice(product, gold18)),
          shop: shop?.shop_name ?? "فروشگاه طلا",
          city: shop?.city ?? "—",
          image: product.image || "/hero-luxury.jpg",
          shopId: product.shop_id,
        };
      });

      if (!cancelled) {
        setProducts(mapped);
        setLoading(false);
      }
    }

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch =
        product.title.includes(search) ||
        product.category.includes(search) ||
        product.shop.includes(search);

      const matchesCategory =
        category === "همه" || product.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sort === "حروف الفبا") {
      result = [...result].sort((a, b) =>
        a.title.localeCompare(b.title, "fa")
      );
    }

    return result;
  }, [products, search, category, sort]);

  useEffect(() => {
    if (!filteredProducts.length) return;

    void Promise.all(
      filteredProducts.map((product) =>
        trackEvent({
          eventType: "list_impression",
          shopId: product.shopId,
          productId: product.id,
        })
      )
    );
  }, [filteredProducts]);

    return (
    <main
      dir="rtl"
      className="min-h-screen bg-white text-[#173C32]"
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#E8EEE9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-[92%] max-w-[1440px] items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227] text-[#C9A227]">
              <span className="text-lg font-semibold">ط</span>
            </div>

            <div className="leading-none">
              <div className="text-lg font-extrabold tracking-tight text-[#173C32]">
                طلاخونه
              </div>
              <div className="mt-1 text-[9px] tracking-[0.28em] text-[#9A7418]">
                TALAKHUNEH
              </div>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#31584D] md:flex">
            <Link
              href="/"
              className="transition hover:text-[#B28A1E]"
            >
              خانه
            </Link>

            <Link
              href="/gold"
              className="font-bold text-[#B28A1E]"
            >
              طلاها
            </Link>

            <Link
              href="/shops"
              className="transition hover:text-[#B28A1E]"
            >
              فروشگاه‌ها
            </Link>

            <Link
              href="#magazine"
              className="transition hover:text-[#B28A1E]"
            >
              مجله
            </Link>

            <Link
              href="#about"
              className="transition hover:text-[#B28A1E]"
            >
              درباره ما
            </Link>
          </nav>

          {/* Mobile menu */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DDE8E1] text-[#173C32] md:hidden"
            aria-label="منو"
          >
            <span className="text-lg">☰</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <section className="mx-auto w-[92%] max-w-[1440px] py-10 md:py-14">
        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 text-sm font-medium text-[#B28A1E]">
            TALAKHUNEH
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#173C32] md:text-4xl">
            پیدا کردن طلای مناسب
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#64766F] md:text-base">
            محصولات طلا را جستجو کنید، قیمت و مشخصات را مقایسه کنید و
            مستقیماً با فروشگاه موردنظر تماس بگیرید.
          </p>
        </div>

        {/* Search */}
        <div className="mb-7">
          <div className="relative">
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9A92]">
              ⌕
            </span>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="جستجوی نام طلا، دسته‌بندی یا فروشگاه..."
              className="h-14 w-full rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] pr-12 pl-4 text-sm text-[#173C32] outline-none transition placeholder:text-[#9AA9A2] focus:border-[#C9A227] focus:bg-white"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => {
              const active = category === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-5 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#173C32] text-white"
                      : "border border-[#DDE8E1] bg-white text-[#426256] hover:border-[#C9A227] hover:text-[#A77F14]"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[#7A8B83]">
              مرتب‌سازی:
            </span>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-[#DDE8E1] bg-white px-4 py-2.5 text-sm text-[#35584D] outline-none focus:border-[#C9A227]"
            >
              <option value="جدیدترین">جدیدترین</option>
              <option value="حروف الفبا">حروف الفبا</option>
            </select>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="rounded-3xl border border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center">
            <div className="text-lg font-bold text-[#173C32]">
              در حال دریافت محصولات...
            </div>
            <p className="mt-2 text-sm text-[#7B8C84]">
              اطلاعات از فروشگاه‌های فعال طلاخونه دریافت می‌شود.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center">
            <div className="text-lg font-bold text-[#173C32]">
              {errorMessage}
            </div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                href={`/gold/${product.id}`}
                className="group overflow-hidden rounded-3xl border border-[#E4ECE7] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#D7BD70] hover:shadow-[0_16px_45px_rgba(23,60,50,0.10)]"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F7F4]">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#173C32] backdrop-blur">
                    {product.category}
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-[#173C32]">
                    {product.title}
                  </h2>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#71837B]">
                    <div className="rounded-xl bg-[#F7FAF8] p-2.5">
                      وزن: {product.weight}
                    </div>

                    <div className="rounded-xl bg-[#F7FAF8] p-2.5">
                      عیار: {product.karat}
                    </div>

                    <div className="rounded-xl bg-[#F7FAF8] p-2.5">
                      اجرت: {product.wage}
                    </div>

                    <div className="rounded-xl bg-[#F7FAF8] p-2.5">
                      {product.city}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="text-xs text-[#819189]">
                      قیمت فعلی
                    </div>

                    <div className="mt-1 text-xl font-extrabold text-[#173C32]">
                      {product.price}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-[#EEF2EF] pt-4">
                    <div>
                      <div className="text-xs text-[#89978F]">
                        فروشگاه
                      </div>

                      <Link
                href={"/shop/" + product.shopId}
                className="mt-1 block text-sm font-semibold text-[#31584D] hover:text-[#A57D18] hover:underline"
                onClick={(event) => event.stopPropagation()}
              >
                {product.shop}
              </Link>
                    </div>

                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DCE7E1] text-[#B28A1E] transition group-hover:border-[#C9A227] group-hover:bg-[#FBF8EE]">
                      ←
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center">
            <div className="text-lg font-bold text-[#173C32]">
              محصولی پیدا نشد
            </div>

            <p className="mt-2 text-sm text-[#7B8C84]">
              عبارت جستجو یا دسته‌بندی را تغییر دهید.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}