"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type Shop = {
  id: number;
  shop_name: string;
  city: string;
  description: string;
  productCount: number;
};

function formatCount(value: number) {
  return value.toLocaleString("fa-IR");
}

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadShops() {
      const { data: rows, error } = await supabase
        .from("shops___")
        .select("id, shop_name, city, description")
        .eq("status", "active")
        .order("id", { ascending: false });

      if (error) {
        if (!cancelled) {
          setErrorMessage("دریافت فروشگاه‌ها ناموفق بود.");
          setLoading(false);
        }
        return;
      }

      const shopsRows = rows ?? [];
      const ids = shopsRows.map((shop) => shop.id);
      let countMap = new Map<number, number>();

      if (ids.length) {
        const { data: products } = await supabase
          .from("products")
          .select("id, shop_id")
          .eq("status", "active")
          .in("shop_id", ids);

        countMap = (products ?? []).reduce((map, row) => {
          map.set(row.shop_id, (map.get(row.shop_id) ?? 0) + 1);
          return map;
        }, new Map<number, number>());
      }

      if (!cancelled) {
        setShops(
          shopsRows.map((shop) => ({
            id: shop.id,
            shop_name: shop.shop_name ?? "فروشگاه طلا",
            city: shop.city ?? "—",
            description:
              shop.description ??
              "فروشگاه فعال در شبکه طلایاب.",
            productCount: countMap.get(shop.id) ?? 0,
          }))
        );
        setLoading(false);
      }
    }

    void loadShops();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-white text-[#173C32]">
      <header className="sticky top-0 z-40 border-b border-[#E8EEE9] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-[92%] max-w-[1440px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227] text-[#C9A227]">
              <span className="text-lg font-semibold">ط</span>
            </div>
            <div className="leading-none">
              <div className="text-lg font-extrabold">طلایاب</div>
              <div className="mt-1 text-[9px] tracking-[0.28em] text-[#9A7418]">TALAYAB</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#31584D] md:flex">
            <Link href="/" className="hover:text-[#B28A1E]">خانه</Link>
            <Link href="/gold" className="hover:text-[#B28A1E]">طلاها</Link>
            <Link href="/shops" className="font-bold text-[#B28A1E]">فروشگاه‌ها</Link>
          </nav>
          <Link href="/gold" className="rounded-xl border border-[#DDE8E1] px-4 py-2.5 text-sm font-bold text-[#416055] hover:border-[#C9A227]">
            مشاهده طلاها
          </Link>
        </div>
      </header>

      <section className="mx-auto w-[92%] max-w-[1440px] py-10 md:py-14">
        <div className="mb-8">
          <div className="mb-3 text-sm font-medium text-[#B28A1E]">TALAYAB</div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">فروشگاه‌های طلا</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#64766F] md:text-base">
            فروشگاه‌های فعال طلایاب را ببینید، محصولاتشان را مقایسه کنید و مستقیماً با فروشگاه موردنظر ارتباط بگیرید.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center">در حال دریافت فروشگاه‌ها...</div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center">{errorMessage}</div>
        ) : shops.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] px-6 py-16 text-center">هنوز فروشگاه فعالی ثبت نشده است.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={"/shop/" + shop.id}
                className="group rounded-[28px] border border-[#DDE8E1] bg-white p-6 transition hover:-translate-y-1 hover:border-[#D5BB6D] hover:shadow-[0_16px_45px_rgba(23,60,50,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173C32] text-xl font-extrabold text-white">
                    {shop.shop_name.charAt(0)}
                  </div>
                  <div className="rounded-full bg-[#F6F1DE] px-3 py-1 text-xs font-bold text-[#9C7617]">
                    {formatCount(shop.productCount)} محصول
                  </div>
                </div>

                <h2 className="mt-6 text-xl font-extrabold">{shop.shop_name}</h2>
                <div className="mt-2 text-sm text-[#71837B]">{shop.city}</div>
                <p className="mt-4 min-h-14 text-sm leading-7 text-[#6F8179]">{shop.description}</p>

                <div className="mt-5 flex items-center justify-between border-t border-[#EEF2EF] pt-4">
                  <span className="text-sm font-bold text-[#31584D]">مشاهده فروشگاه</span>
                  <span className="text-[#A27A17] transition group-hover:-translate-x-1">←</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
