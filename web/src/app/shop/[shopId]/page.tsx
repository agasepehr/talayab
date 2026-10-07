"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { trackEvent } from "../../../lib/analytics";

type Shop = {
  id: number;
  shopName: string;
  city: string;
  description: string;
  phone: string;
  instagram: string;
  latitude: number | null;
  longitude: number | null;
};

type Product = {
  id: number;
  title: string;
  category: string;
  weight: number;
  karat: number;
  wage: string;
  price: string;
  image: string;
};

type RawProduct = {
  id: number;
  title: string | null;
  category_id: number | null;
  weight: number | null;
  karat: number | null;
  wage_type: string | null;
  wage_value: number | null;
  profit_percent: number | null;
  extra_fee: number | null;
  image: string | null;
};

function formatToman(value: number) {
  return Math.round(value).toLocaleString("fa-IR") + " تومان";
}

function calculatePrice(product: RawProduct, gold18: number) {
  const weight = Number(product.weight ?? 0);
  const goldValue = weight * gold18;
  const wage =
    product.wage_type === "percent"
      ? goldValue * (Number(product.wage_value ?? 0) / 100)
      : Number(product.wage_value ?? 0);
  const profit =
    (goldValue + wage) * (Number(product.profit_percent ?? 0) / 100);

  return goldValue + wage + profit + Number(product.extra_fee ?? 0);
}

export default function ShopPage() {
  const params = useParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const viewTracked = useRef(false);

  useEffect(() => {
    const shopId = Number(params.shopId);

    if (!Number.isInteger(shopId) || shopId <= 0) {
      setErrorMessage("شناسه فروشگاه نامعتبر است.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadShop() {
      const { data: shopRow, error: shopError } = await supabase
        .from("shops___")
        .select("id,shop_name,city,description,phone,instagram,latitude,longitude")
        .eq("id", shopId)
        .eq("status", "active")
        .maybeSingle();

      if (shopError || !shopRow) {
        if (!cancelled) {
          setErrorMessage("فروشگاه موردنظر پیدا نشد.");
          setLoading(false);
        }
        return;
      }

      const [
        { data: productRows, error: productError },
        { data: categoryRows, error: categoryError },
        { data: marketRow, error: marketError },
      ] = await Promise.all([
        supabase
          .from("products")
          .select("id,title,category_id,weight,karat,wage_type,wage_value,profit_percent,extra_fee,image")
          .eq("shop_id", shopId)
          .eq("status", "active")
          .order("id", { ascending: false }),
        supabase.from("categories").select("id,name"),
        supabase.from("market_prices").select("gold18").order("id", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (productError || categoryError || marketError) {
        if (!cancelled) {
          setErrorMessage("دریافت محصولات فروشگاه ناموفق بود.");
          setLoading(false);
        }
        return;
      }

      const categoryMap = new Map<number, string>();
      (categoryRows ?? []).forEach((category) => {
        categoryMap.set(category.id, category.name);
      });

      const gold18 = Number(marketRow?.gold18 ?? 0);
      const mappedProducts = (productRows ?? []).map((product) => ({
        id: product.id,
        title: product.title ?? "محصول طلا",
        category: categoryMap.get(product.category_id ?? 0) ?? "سایر",
        weight: Number(product.weight ?? 0),
        karat: Number(product.karat ?? 18),
        wage:
          product.wage_type === "percent"
            ? Number(product.wage_value ?? 0).toLocaleString("fa-IR") + "٪"
            : formatToman(Number(product.wage_value ?? 0)),
        price: formatToman(calculatePrice(product, gold18)),
        image: product.image || "/hero-luxury.jpg",
      })) as Product[];

      if (!cancelled) {
        setShop({
          id: shopRow.id,
          shopName: shopRow.shop_name ?? "فروشگاه طلا",
          city: shopRow.city ?? "—",
          description: shopRow.description ?? "این فروشگاه یکی از فروشگاه‌های فعال طلایاب است.",
          phone: shopRow.phone ?? "",
          instagram: shopRow.instagram ?? "",
          latitude: shopRow.latitude,
          longitude: shopRow.longitude,
        });
        setProducts(mappedProducts);
        setLoading(false);
      }
    }

    void loadShop();

    return () => {
      cancelled = true;
    };
  }, [params.shopId]);

  useEffect(() => {
    if (!shop || viewTracked.current) return;
    viewTracked.current = true;
    void trackEvent({ eventType: "store_page_view", shopId: shop.id });
  }, [shop]);

  if (loading) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F4F8F6] text-[#173C32]">
        <div className="rounded-3xl border border-[#DDE7E1] bg-white px-8 py-10 text-center shadow-sm">
          <div className="text-lg font-extrabold">در حال بارگذاری فروشگاه...</div>
          <div className="mt-2 text-sm text-[#7A8B83]">اطلاعات فروشگاه از طلایاب دریافت می‌شود.</div>
        </div>
      </main>
    );
  }

  if (!shop) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-[#F4F8F6] px-4 text-[#173C32]">
        <div className="rounded-3xl border border-[#DDE7E1] bg-white px-8 py-10 text-center shadow-sm">
          <div className="text-lg font-extrabold">{errorMessage || "فروشگاه پیدا نشد."}</div>
          <Link href="/shops" className="mt-5 inline-flex rounded-xl bg-[#173C32] px-5 py-3 text-sm font-bold text-white">بازگشت به فروشگاه‌ها</Link>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-[#EDF7F2] via-[#F8FBF9] to-[#ECF5F0] text-[#173C32]">
      <header className="sticky top-0 z-40 border-b border-[#DDE9E2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 w-[92%] max-w-[1440px] items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227] text-[#C9A227]"><span className="text-lg font-bold">ط</span></div>
            <div className="leading-none">
              <div className="text-lg font-extrabold">طلایاب</div>
              <div className="mt-1 text-[9px] tracking-[0.28em] text-[#A27A17]">TALAYAB</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <Link href="/" className="text-[#426256] hover:text-[#B28A1E]">خانه</Link>
            <Link href="/gold" className="text-[#426256] hover:text-[#B28A1E]">طلاها</Link>
            <Link href="/shops" className="font-bold text-[#B28A1E]">فروشگاه‌ها</Link>
          </nav>
          <Link href="/seller" className="rounded-xl border border-[#DDE8E1] px-4 py-2.5 text-sm font-bold text-[#416055] hover:border-[#C9A227]">پنل فروشنده</Link>
        </div>
      </header>

      <section className="mx-auto w-[92%] max-w-[1440px] py-6 md:py-10">
        <div className="mb-6 text-xs text-[#71837B]">
          <Link href="/" className="hover:text-[#A27A17]">خانه</Link>
          <span className="mx-2">/</span>
          <Link href="/shops" className="hover:text-[#A27A17]">فروشگاه‌ها</Link>
          <span className="mx-2">/</span>
          <span>{shop.shopName}</span>
        </div>

        <section className="rounded-[30px] border border-[#D9E7DF] bg-white p-5 shadow-[0_18px_60px_rgba(23,60,50,0.08)] md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#173C32] text-2xl font-extrabold text-white">{shop.shopName.charAt(0)}</div>
              <div>
                <h1 className="text-2xl font-extrabold md:text-4xl">{shop.shopName}</h1>
                <div className="mt-2 text-sm text-[#71837B]">{shop.city}</div>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-[#667971]">{shop.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {shop.phone && (
                <a href={"tel:" + shop.phone} className="rounded-xl bg-[#173C32] px-5 py-3 text-sm font-bold text-white hover:bg-[#245747]">تماس با فروشگاه</a>
              )}
              {shop.instagram && (
                <a href={"https://instagram.com/" + shop.instagram} target="_blank" rel="noreferrer" className="rounded-xl border border-[#DDE8E1] bg-white px-5 py-3 text-sm font-bold text-[#31584D] hover:border-[#C9A227]">اینستاگرام</a>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-[#F7FAF8] p-4"><div className="text-xs text-[#84948C]">تعداد محصولات</div><div className="mt-2 text-xl font-extrabold">{products.length.toLocaleString("fa-IR")}</div></div>
            <div className="rounded-2xl bg-[#F7FAF8] p-4"><div className="text-xs text-[#84948C]">وضعیت فروشگاه</div><div className="mt-2 font-bold text-[#2E725C]">فعال</div></div>
            <div className="hidden rounded-2xl bg-[#F7FAF8] p-4 md:block"><div className="text-xs text-[#84948C]">شهر</div><div className="mt-2 font-bold">{shop.city}</div></div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold md:text-2xl">محصولات این فروشگاه</h2>
              <p className="mt-2 text-sm text-[#71837B]">قیمت‌ها بر اساس قیمت فعلی طلای ۱۸ عیار طلایاب محاسبه می‌شوند.</p>
            </div>
            <Link href="/gold" className="text-sm font-bold text-[#A27A17] hover:underline">همه طلاها</Link>
          </div>

          {products.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-[#DDE8E1] bg-white px-6 py-16 text-center">هنوز محصول فعالی در این فروشگاه ثبت نشده است.</div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={"/gold/" + product.id}
                  className="group overflow-hidden rounded-[24px] border border-[#DDE8E1] bg-white transition hover:-translate-y-1 hover:border-[#D5BB6D] hover:shadow-[0_16px_45px_rgba(23,60,50,0.08)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-[#EEF5F1]"><img src={product.image} alt={product.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                  <div className="p-5">
                    <div className="text-xs text-[#A47C19]">{product.category}</div>
                    <h3 className="mt-2 text-lg font-bold">{product.title}</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#71837B]">
                      <div className="rounded-xl bg-[#F7FAF8] p-2.5">وزن: {product.weight.toLocaleString("fa-IR")} گرم</div>
                      <div className="rounded-xl bg-[#F7FAF8] p-2.5">عیار: {product.karat.toLocaleString("fa-IR")}</div>
                      <div className="rounded-xl bg-[#F7FAF8] p-2.5">اجرت: {product.wage}</div>
                      <div className="rounded-xl bg-[#F7FAF8] p-2.5">{shop.city}</div>
                    </div>
                    <div className="mt-5 text-xl font-extrabold text-[#173C32]">{product.price}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 rounded-[26px] border border-[#DDE8E1] bg-white p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-extrabold">موقعیت فروشگاه</h2>
              <p className="mt-2 text-sm leading-7 text-[#71837B]">برای مشاهده مسیر، موقعیت ثبت‌شده فروشگاه را روی نقشه باز کنید.</p>
            </div>
            {shop.latitude !== null && shop.longitude !== null ? (
              <a
                href={"https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(String(shop.latitude) + "," + String(shop.longitude))}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#DDE8E1] px-5 py-3 text-sm font-bold text-[#31584D] hover:border-[#C9A227]"
              >
                مشاهده روی نقشه
              </a>
            ) : (
              <div className="text-sm text-[#87958F]">موقعیت دقیق هنوز ثبت نشده است.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
